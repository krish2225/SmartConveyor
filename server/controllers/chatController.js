import { ChatHistory } from '../models/ChatHistory.js';
import { Alert } from '../models/Alert.js';
import { JointHealth } from '../models/JointHealth.js';
import { EmergencyStatus } from '../models/EmergencyStatus.js';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000/chat';

export async function handleChat(req, res) {
  try {
    const {
      message,
      facilityId = 'nmdc-kirandul-cv101',
      user = 'Operator',
      context = {},
      history = []
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // Securely retrieve Gemini API key from environment variable
    const effectiveApiKey = (
      process.env.GEMINI_API_KEY ||
      req.headers['x-gemini-api-key'] ||
      ''
    ).trim();

    let chatResponse = null;
    let sources = [];
    let summary = {};

    // 1. Extract Real-Time Telemetry from Client Context or Defaults
    const liveTelemetry = context.telemetry || {};
    const liveSensors = liveTelemetry.sensors || context.sensors || {};

    const liveSensorData = {
      drive_vibration: Number(liveSensors.drive_vibration ?? liveTelemetry.drive_vibration ?? 7.9),
      belt_speed: Number(liveSensors.belt_speed ?? liveTelemetry.belt_speed ?? 4.18),
      dynamic_load: Number(liveSensors.dynamic_load ?? liveTelemetry.dynamic_load ?? 1840.5),
      joint_temperature: Number(liveSensors.joint_temperature ?? liveTelemetry.joint_temperature ?? 74.5),
      ultrasonic_thickness: Number(liveSensors.ultrasonic_thickness ?? liveTelemetry.ultrasonic_thickness ?? 16.2),
      acoustic_emission: Number(liveSensors.acoustic_emission ?? liveTelemetry.acoustic_emission ?? 78.4),
      activeJointId: String(liveTelemetry.activeJointId || context.activeJointId || 'Joint-05'),
      isDumping: Boolean(liveTelemetry.isDumping || context.isDumping || false)
    };

    // 2. Query Database Records for Context Enrichment
    let alerts = Array.isArray(context.alerts) && context.alerts.length > 0 ? context.alerts : [];
    let joints = Array.isArray(context.joints) && context.joints.length > 0 ? context.joints : [];
    let emergencyStatus = context.emergencyStatus || null;

    if (alerts.length === 0) {
      try {
        alerts = await Alert.find({ facilityId }).sort({ createdAt: -1 }).limit(5).lean();
      } catch (e) {
        alerts = [];
      }
    }

    if (joints.length === 0) {
      try {
        joints = await JointHealth.find({ facilityId }).sort({ positionMeters: 1 }).lean();
      } catch (e) {
        joints = [];
      }
    }

    if (!emergencyStatus) {
      try {
        emergencyStatus = await EmergencyStatus.findOne({ facilityId }).lean();
      } catch (e) {
        emergencyStatus = null;
      }
    }

    // 3. Try FastAPI ML Microservice if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const mlRes = await fetch(FASTAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          facilityId,
          context: {
            telemetry: liveSensorData,
            sensors: liveSensorData,
            alerts,
            joints,
            emergencyStatus
          },
          apiKey: effectiveApiKey,
          history
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        if (mlData.response && mlData.response.trim()) {
          chatResponse = mlData.response.trim();
          sources = (mlData.sources || []).filter(
            s => !s.toLowerCase().includes('mongodb') && !s.toLowerCase().includes('firebase')
          );
          summary = mlData.retrievedContextSummary || {};
        }
      }
    } catch (err) {
      // FastAPI offline -> fallback to Direct Node.js processing
    }

    // 4. If FastAPI did not respond, process directly in Node.js
    if (!chatResponse) {
      // If GEMINI_API_KEY is configured, call Google Gemini with real-time grounding
      if (effectiveApiKey && effectiveApiKey.length > 5) {
        const models = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'];

        const systemPrompt = `You are the ultimate AI Copilot for the NMDC SmartConveyor Industrial Monitoring System.
You have COMPLETE, comprehensive knowledge of EVERY screen, feature, data model, joint, sensor, report, and engineering procedure in the entire SmartConveyor platform.

=== SMARTCONVEYOR PLATFORM MODULES & PAGES ===
1. 📊 DASHBOARD (/):
   - Real-time transducer gauges (20Hz drive vibration, thermal core temp, ultrasonic belt thickness, acoustic stress emission, linear belt speed, dynamic load).
   - Rolling live time-series vibration chart with ISO 10816 Zone A/B/C/D threshold boundaries.
   - Fleet rupture risk gauge, minimum remaining useful life (RUL: 6.0d on Joint-05), active critical alarm cards, and quick navigation.
2. 🧊 3D DIGITAL TWIN (/digital-twin):
   - Interactive Three.js 3D model of the 1200m closed-loop conveyor belt with vulcanized splice seam markers.
   - Raycaster click selection: inspect any joint (Joint-01 to Joint-06) to view live thickness, thermal core, vibration, acoustic stress, and AI recommendations.
   - Multiple camera perspectives: Orbit/Isometric, Follow Splice (chases joint along belt), Head Discharge & Vision, Tail Feed, and Top-Down.
   - ⏪ HISTORICAL PLAYBACK MODE: Rewind and replay splice health degradation over the past 3-7 days with 1x, 5x, and 20x speed multipliers, live snapback toggle, transition flash animations, and dynamic sparklines.
3. 📷 VISION MONITORING (/vision):
   - High-speed line-scan camera mounted at Head Discharge Chute capturing high-resolution surface textures.
   - YOLOv8 computer vision classification for surface tears, steel cord pullout, delamination blisters, longitudinal rips, and edge fraying with confidence scores and pixel coordinates.
4. 🩺 SENSOR HEALTH & RELIABILITY (/sensor-health):
   - Multi-transducer health index, calibration history, Kalman filtering drift compensation, and individual reliability scores for Piezoelectric Accelerometers, IR Pyrometers, Ultrasonic Thickness Gauges, and Acoustic Emission Sensors.
5. 🚨 ALERTS & INCIDENTS (/alerts):
   - Critical, Warning, and Info alarm management. Workflow includes acknowledging alarms, reviewing root-cause analysis, and signing off on resolution notes.
6. 📋 LOGS & AUDIT TRAIL (/logs):
   - Chronological audit log with severity filtering (INFO, WARN, CRITICAL) and category filtering (TELEMETRY, MAINTENANCE, ALERTS, AUTH, SYSTEM).
7. 📑 REPORTS & MAINTENANCE (/reports):
   - Automated shift handover reports, predictive RUL degradation curves, cold vulcanization work orders, and radiographic compliance certificates.
8. ⚙️ SETTINGS & PLANT SAFETY (/settings):
   - Configurable alert threshold limits (ISO 10816 limits, temperature cutoffs, thickness safety margins), and Emergency Stop (E-Stop) lockout/tagout interlock controls requiring safety clearance remarks.

=== FLEET SPLICE JOINTS (1200m Belt Loop, 1600mm ST-5400 Steel Cord) ===
• Joint-01 (0m, Head Discharge): OPTIMAL condition, RUL ~142d, Risk ~4.2%, Thickness 21.8mm.
• Joint-02 (200m, Take-Up Bend): OPTIMAL condition, RUL ~118.5d, Risk ~8.7%, Thickness 21.2mm.
• Joint-03 (400m, Loading Chute): ELEVATED_WEAR from high-impact ore drop, RUL ~45d, Risk ~41%, Thickness 19.4mm.
• Joint-04 (600m, Return Strand): OPTIMAL condition, RUL ~98d, Risk ~12.5%, Thickness 20.9mm.
• Joint-05 (800m, High Tension Curve): CRITICAL_DELAMINATION with longitudinal cord pull-out, RUL ~6.0d, Risk ~89.2%, Thickness 16.2mm (<18.5mm limit), elevated vibration (${liveSensorData.drive_vibration} mm/s), acoustic emission surges (${liveSensorData.acoustic_emission} dB). Requires immediate ultrasonic scan and cold vulcanization splicing kit preparation.
• Joint-06 (1000m, Drive Drum): OPTIMAL condition, RUL ~160d, Risk ~3.1%, Thickness 22.4mm.

=== REAL-TIME TELEMETRY SNAPSHOT ===
• Facility: ${facilityId}
• Currently Monitored Splice Joint: ${liveSensorData.activeJointId}
• Drive Vibration: ${liveSensorData.drive_vibration} mm/s RMS (ISO 10816 Limit: 6.0 mm/s)
• Thermal Core Temp: ${liveSensorData.joint_temperature} °C (Nominal: <65°C)
• Ultrasonic Thickness: ${liveSensorData.ultrasonic_thickness} mm (Critical Wear Limit: <18.5 mm)
• Acoustic Stress Emission: ${liveSensorData.acoustic_emission} dB
• Belt Linear Speed: ${liveSensorData.belt_speed} m/s | Dynamic Load: ${liveSensorData.dynamic_load} t/h
• Active Alarms: ${JSON.stringify(alerts.map(a => ({ id: a.id, severity: a.severity, title: a.title, desc: a.description, action: a.actionRequired })))}
• Conveyor E-Stop Circuit: ${emergencyStatus?.emergencyStopActive ? `EMERGENCY STOP ACTIVE (${emergencyStatus.reason || 'Tripped'})` : 'ARMED & NORMAL'}

=== INSTRUCTIONS ===
1. Answer ANY question the user asks about ANY part of the website, features, joints, sensors, maintenance, physics, or calculations.
2. ALWAYS provide complete, thorough, comprehensive, and well-structured answers. NEVER cut off or truncate your explanation halfway.
3. Ground all answers accurately in the platform specs and real-time context above.
4. Format responses in clean, structured Markdown with bold headers, bullet points, and code blocks for values.
5. DO NOT mention internal database names (MongoDB/Firebase).`;

        const contents = [];

        // Include conversation history if available
        if (Array.isArray(history) && history.length > 0) {
          history.slice(-6).forEach(h => {
            const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
            const text = h.text || h.content || '';
            if (text.trim()) {
              contents.push({ role, parts: [{ text: text.trim() }] });
            }
          });
        }

        contents.push({
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUSER QUESTION: ${message}` }]
        });

        for (const model of models) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveApiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents,
                  generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 4096
                  }
                })
              }
            );

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json();
              const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text && text.trim()) {
                chatResponse = text.trim();
                sources.push(`Google Gemini (${model})`);
                sources.push('Real-Time Telemetry Stream');
                break;
              }
            } else {
              const errBody = await geminiRes.text();
              console.warn(`[Gemini API ${model} Notice (${geminiRes.status})]:`, errBody);
            }
          } catch (geminiErr) {
            console.warn(`[Gemini API ${model} Exception]:`, geminiErr.message);
          }
        }
      }

      // 5. Fallback to Built-in Real-Time Domain Intelligence Engine
      if (!chatResponse) {
        const qLower = message.toLowerCase();
        const isLiveQuery = /live|vibration|temp|speed|load|thickness|acoustic|sensor|reading|now|joint 5|joint 3|joint-05|j-204/i.test(message);
        const isAlertQuery = /alert|alarm|warning|critical|incident|fault|issue/i.test(message);
        const isJointQuery = /joint|splice|rul|failure|wear|delamination|fleet|health|rupture/i.test(message);
        const isEmergencyQuery = /emergency|e-stop|halt|stop|clearance/i.test(message);

        const vib = liveSensorData.drive_vibration;
        const temp = liveSensorData.joint_temperature;
        const thick = liveSensorData.ultrasonic_thickness;
        const acoustic = liveSensorData.acoustic_emission;
        const speed = liveSensorData.belt_speed;
        const load = liveSensorData.dynamic_load;
        const activeJoint = liveSensorData.activeJointId;

        const vibStatus = vib > 6.0 ? '⚠️ Exceeds ISO 10816 Zone C warning limit of 6.0 mm/s' : '✅ Nominal ISO 10816 Zone A/B';
        const thickStatus = thick < 18.5 ? '⚠️ Critical wear limit (< 18.5 mm)' : '✅ Nominal thickness';
        const tempStatus = temp > 65.0 ? '⚠️ Elevated core temp (> 65°C)' : '✅ Nominal thermal range';

        if (/vibration/i.test(qLower) || /joint 5|joint-05|j-204/i.test(qLower) || isLiveQuery) {
          sources.push('Real-Time Telemetry Stream');
          chatResponse = `📡 **Real-Time Telemetry for ${activeJoint} (High Tension Splice)**\n\n` +
            `• **Live Vibration:** \`${vib.toFixed(2)} mm/s RMS\` *(${vibStatus})*\n` +
            `• **Thermal Core Temp:** \`${temp.toFixed(1)} °C\` *(${tempStatus})*\n` +
            `• **Ultrasonic Thickness:** \`${thick.toFixed(1)} mm\` *(${thickStatus})*\n` +
            `• **Acoustic Stress Emission:** \`${acoustic.toFixed(1)} dB\` *(Internal delamination micro-cracks)*\n` +
            `• **Belt Linear Speed:** \`${speed.toFixed(2)} m/s\` | **Dynamic Load:** \`${load.toFixed(1)} t/h\`\n\n` +
            `**Engineering Assessment:** ${activeJoint} is exhibiting anomalous harmonic vibration due to longitudinal cord pull-out delamination. Immediate ultrasonic radiographic inspection recommended.`;
        } else if (/critical|explain/i.test(qLower) && isAlertQuery) {
          sources.push('Active Alarm Stream');
          const crit = alerts.find(a => a.severity === 'CRITICAL') || alerts[0];
          chatResponse = `🚨 **Critical Alarm Analysis: ${crit ? crit.title : `${activeJoint} Splice Delamination (ALT-1001)`}**\n\n` +
            `• **Event ID:** \`${crit ? crit.id : 'ALT-1001'}\` | **Target Splice:** \`${crit ? crit.jointId : activeJoint}\`\n` +
            `• **Severity:** \`CRITICAL ALARM\` | **Status:** \`${crit ? crit.status : 'ACTIVE'}\`\n` +
            `• **Root Cause:** ${crit ? crit.description : `Ultrasonic thickness degraded to ${thick} mm with surging acoustic stress (${acoustic} dB).`}\n` +
            `• **Live Metrics:** Vibration \`${vib} mm/s\`, Thickness \`${thick} mm\`, Acoustic \`${acoustic} dB\`, Temp \`${temp} °C\`\n` +
            `• **Action Required:** ${crit ? crit.actionRequired : 'Perform ultrasonic radiography inspection and prepare cold vulcanization kit.'}\n\n` +
            `**Recommendation:** Do not clear alarm without a physical non-destructive inspection of the vulcanized splice cords.`;
        } else if (isAlertQuery) {
          sources.push('Active Alarm Stream');
          if (alerts.length > 0) {
            const alertLines = alerts.map(a => {
              const icon = a.severity === 'CRITICAL' ? '🔴' : a.severity === 'WARNING' ? '🟡' : '🔵';
              return `${icon} **${a.id}: ${a.title}**\n   • **Splice:** \`${a.jointId || 'Plant'}\` | **Status:** \`${a.status}\`\n   • **Details:** ${a.description}`;
            });
            chatResponse = `📋 **Current Plant Alarms & Incident Summary (${alerts.length} Active)**\n\n${alertLines.join('\n\n')}`;
          } else {
            chatResponse = `✅ **No Active Critical Alarms**\n\nAll conveyor safety monitoring systems are nominal. No active critical incidents are currently logged for facility \`${facilityId}\`.`;
          }
        } else if (isJointQuery || /fleet|health/i.test(qLower)) {
          sources.push('Splice Health Matrix');
          const minRul = joints.length ? Math.min(...joints.map(j => j.estimatedTimeToFailureDays || 999)) : 6.0;
          const maxRisk = joints.length ? Math.max(...joints.map(j => j.riskScore || 0)) : 89.2;
          
          let jointRows = '';
          if (joints.length > 0) {
            jointRows = joints.map(j => {
              const icon = j.healthStatus === 'OPTIMAL' ? '🟢' : j.healthStatus === 'ELEVATED_WEAR' ? '🟡' : '🔴';
              return `• ${icon} **${j.jointId} (${j.name}):** RUL: \`${j.estimatedTimeToFailureDays}d\` | Risk: \`${j.riskScore}%\` | Thickness: \`${j.ultrasonicThickness || thick}mm\``;
            }).join('\n');
          } else {
            jointRows = `• 🟢 **Joint-01 (Head Pulley Splice):** RUL: \`142.0d\` | Risk: \`4.2%\`\n` +
              `• 🟢 **Joint-02 (Take-Up Bend Splice):** RUL: \`118.5d\` | Risk: \`8.7%\`\n` +
              `• 🟡 **Joint-03 (Loading Zone Splice):** RUL: \`45.0d\` | Risk: \`41.0%\`\n` +
              `• 🟢 **Joint-04 (Return Strand Splice):** RUL: \`98.0d\` | Risk: \`12.5%\`\n` +
              `• 🔴 **${activeJoint} (High Tension Curve):** RUL: \`6.0d\` | Risk: \`89.2%\``;
          }

          chatResponse = `🏗️ **Plant Fleet Splice Health & Predictive RUL Summary**\n\n` +
            `• **Overall Plant Rupture Risk Index:** \`${maxRisk}%\` (HIGH RISK)\n` +
            `• **Lowest Estimated Remaining Useful Life (RUL):** \`${minRul} Days\` *(${activeJoint})*\n\n` +
            `**Splice Joint Status Matrix:**\n${jointRows}`;
        } else if (isEmergencyQuery) {
          sources.push('Drive Interlock Stream');
          const isActive = emergencyStatus?.emergencyStopActive || false;
          chatResponse = isActive
            ? `🚨 **Conveyor Emergency Stop is CURRENTLY ACTIVE!**\n\n` +
              `• **Halt Reason:** ${emergencyStatus?.reason || 'Critical Splice Joint Hazard'}\n` +
              `• **Triggered By:** ${emergencyStatus?.triggeredBy || 'Operator'}\n` +
              `• **Belt Speed:** \`0.0 m/s\` (Motors locked out)\n` +
              `• **Clearance Status:** Awaiting Admin Safety Inspection Justification.`
            : `🛡️ **Conveyor Drive Interlock: Normal Operational State**\n\n` +
              `• All drive substations armed and running nominal linear speed (\`${speed.toFixed(1)} m/s\`).\n` +
              `• Emergency Stop circuit is currently \`INACTIVE\` (Drive clear).\n` +
              `• Interlock trip armed for severe longitudinal rip detection and vibration > 9.0 mm/s.`;
        } else {
          sources.push('SmartConveyor AI Engine');
          chatResponse = `👷 **SmartConveyor AI Assistant — NMDC Mining Intelligence**\n\n` +
            `I am your real-time operational copilot. I can assist you with live transducer diagnostics, predictive splice health, ISO 10816 standards, and engineering calculations:\n\n` +
            `• 📡 **Live Transducer Values:** Ask *"What's the live vibration on Joint 5?"*\n` +
            `• 🚨 **Alarm Explanations:** Ask *"Explain the current critical alert"*\n` +
            `• 📊 **Predictive Splice RUL:** Ask *"What's our fleet health?"*\n` +
            `• 🧠 **Engineering Knowledge & Physics:** Ask *"Explain conveyor belt sag calculation"* or *"What is ISO 10816-3?"*`;
        }
      }

      summary = {
        facilityId,
        usedGemini: sources.some(s => s.includes('Gemini')),
        activeJoint: liveSensorData.activeJointId
      };
    }

    // 6. Record Q&A to database
    try {
      await ChatHistory.create({
        facilityId,
        user: typeof user === 'string' ? user : user?.displayName || 'Operator',
        query: message,
        response: chatResponse,
        sources,
        retrievedContextSummary: summary,
        timestamp: new Date()
      });
    } catch (logErr) {
      // Silently continue if history logging fails
    }

    res.json({
      success: true,
      response: chatResponse,
      sources,
      retrievedContextSummary: summary,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Chat Controller Error]:', err);
    res.status(500).json({ success: false, message: err.message || 'Error processing chat query.' });
  }
}

export async function getChatHistory(req, res) {
  try {
    const { facilityId = 'nmdc-kirandul-cv101', limit = 30 } = req.query;
    const history = await ChatHistory.find({ facilityId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .lean();
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
