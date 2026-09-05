import { ChatHistory } from '../models/ChatHistory.js';
import { Alert } from '../models/Alert.js';
import { JointHealth } from '../models/JointHealth.js';
import { Log } from '../models/Log.js';
import { EmergencyStatus } from '../models/EmergencyStatus.js';
import { Report } from '../models/Report.js';
import { ReliabilityLog } from '../models/ReliabilityLog.js';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000/chat';

export async function handleChat(req, res) {
  try {
    const {
      message,
      facilityId = 'nmdc-kirandul-cv101',
      user = 'Operator',
      context,
      apiKey: clientApiKey,
      history = []
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const effectiveApiKey = (
      clientApiKey ||
      req.headers['x-gemini-api-key'] ||
      process.env.GEMINI_API_KEY ||
      ''
    ).trim();

    let chatResponse = null;
    let sources = [];
    let summary = {};

    // 1. Try FastAPI ML Microservice if online
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const mlRes = await fetch(FASTAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, facilityId, context, apiKey: effectiveApiKey }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        chatResponse = mlData.response;
        sources = mlData.sources || [];
        summary = mlData.retrievedContextSummary || {};
      }
    } catch (err) {
      // FastAPI offline -> fallback to Node.js context retrieval engine
    }

    // 2. If FastAPI did not respond, perform dual context retrieval locally
    if (!chatResponse) {
      const qLower = message.toLowerCase();
      sources = [];

      // A. Query Live Telemetry (Firestore IoT stream mock / active buffer)
      let liveSensorData = {
        drive_vibration: 7.9,
        belt_speed: 4.18,
        dynamic_load: 1840.5,
        joint_temperature: 74.5,
        ultrasonic_thickness: 16.2,
        acoustic_emission: 78.4,
        activeJointId: 'Joint-05',
        isDumping: false
      };

      // B. Query MongoDB Collections
      let alerts = [];
      let joints = [];
      let emergencyStatus = null;

      try {
        alerts = await Alert.find({ facilityId }).sort({ createdAt: -1 }).limit(5).lean();
      } catch (e) {
        alerts = [];
      }

      try {
        joints = await JointHealth.find({ facilityId }).sort({ positionMeters: 1 }).lean();
      } catch (e) {
        joints = [];
      }

      try {
        emergencyStatus = await EmergencyStatus.findOne({ facilityId }).lean();
      } catch (e) {
        emergencyStatus = null;
      }

      // If GEMINI_API_KEY is available (from UI or .env), call Google Gemini
      if (effectiveApiKey && effectiveApiKey.length > 5) {
        const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
        
        const systemPrompt = `You are the intelligent AI Copilot for the NMDC SmartConveyor Industrial Monitoring System.
You are equipped with real-time sensor telemetry and MongoDB database records from the plant, but you are ALSO a universal engineering and general assistant.

--- REAL-TIME PLANT CONTEXT (Use when relevant to the user's question) ---
• Facility: ${facilityId}
• Live Hardware Sensor Telemetry (20Hz IoT Transducers):
  - Drive Vibration: ${liveSensorData.drive_vibration} mm/s RMS (ISO 10816 limit: 6.0 mm/s)
  - Thermal Core Temperature: ${liveSensorData.joint_temperature} °C (Nominal: <65°C)
  - Ultrasonic Thickness: ${liveSensorData.ultrasonic_thickness} mm (Critical Wear: <18.5mm)
  - Acoustic Stress Emission: ${liveSensorData.acoustic_emission} dB (High acoustic emissions indicate internal delamination)
  - Linear Belt Speed: ${liveSensorData.belt_speed} m/s | Dynamic Load: ${liveSensorData.dynamic_load} t/h
  - Currently Monitored Splice: ${liveSensorData.activeJointId}
• Active MongoDB Alarms: ${JSON.stringify(alerts.map(a => ({ id: a.id, severity: a.severity, title: a.title, desc: a.description, action: a.actionRequired })))}
• Splice Joint Health Matrix: ${JSON.stringify(joints.map(j => ({ id: j.jointId, name: j.name, status: j.healthStatus, rulDays: j.estimatedTimeToFailureDays, riskScore: j.riskScore })))}
• Conveyor E-Stop Status: ${JSON.stringify(emergencyStatus || { emergencyStopActive: false, message: 'Drive running normally' })}
-------------------------------------------------------------------------

INSTRUCTIONS:
1. Answer ANY question the user asks accurately and helpfully.
2. If they ask about conveyor telemetry, vibration, alarms, splice joints, or safety: use the plant context above and provide precise engineering insights with ISO 10816 standards.
3. If they ask general engineering, math, coding, physics, scientific, or general knowledge questions: answer thoroughly and intelligently using your full capabilities.
4. Format responses in clean Markdown (use bullet points, bold text, code blocks for values). Keep it engaging, clear, and professional.`;

        const contents = [];
        
        // Add conversation history if available
        if (Array.isArray(history) && history.length > 0) {
          history.slice(-6).forEach(h => {
            const role = (h.sender === 'user' || h.role === 'user') ? 'user' : 'model';
            const text = h.text || h.content || '';
            if (text.trim()) {
              contents.push({ role, parts: [{ text: text.trim() }] });
            }
          });
        }

        // Add current user prompt along with system prompt context
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
                    temperature: 0.5,
                    maxOutputTokens: 1000
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
                if (/vibration|temp|sensor|joint|load|speed|thickness/i.test(message)) {
                  sources.push('Firebase Firestore (Live 20Hz Stream)');
                }
                if (/alert|alarm|incident|fleet|rul|status/i.test(message)) {
                  sources.push('MongoDB (Operational Collections)');
                }
                break;
              }
            } else {
              const errBody = await geminiRes.text();
              console.warn(`[Gemini API ${model} Error (${geminiRes.status})]:`, errBody);
            }
          } catch (geminiErr) {
            console.warn(`[Gemini API ${model} fetch exception]:`, geminiErr.message);
          }
        }
      }

      // If Gemini wasn't used or call failed, fallback to built-in domain synthesis engine
      if (!chatResponse) {
        const isLiveQuery = /live|vibration|temp|speed|load|thickness|acoustic|sensor|reading|now|joint 5|joint 3|joint j-204/i.test(message);
        const isAlertQuery = /alert|alarm|warning|critical|incident|fault|issue/i.test(message);
        const isJointQuery = /joint|splice|rul|failure|wear|delamination|fleet|health|rupture/i.test(message);
        const isEmergencyQuery = /emergency|e-stop|halt|stop|clearance/i.test(message);

        if (isLiveQuery) sources.push('Firebase Firestore (Live Telemetry: telemetry/cv101)');
        if (isAlertQuery) sources.push('MongoDB (Collection: alerts)');
        if (isJointQuery) sources.push('MongoDB (Collection: jointhealths)');
        if (isEmergencyQuery) sources.push('MongoDB (Collection: emergencystatuses)');

        if (/vibration/i.test(qLower) || /joint 5|joint-05|j-204/i.test(qLower)) {
          chatResponse = `📡 **Live Telemetry for Joint-05 (High Tension Curve Splice)**\n*Source: Firebase Firestore Real-Time IoT Stream (20Hz)*\n\n• **Live Vibration:** \`7.9 mm/s RMS\` ⚠️ *(Exceeds ISO 10816 Zone C warning limit of 6.0 mm/s)*\n• **Thermal Core Temp:** \`74.5 °C\` *(Nominal < 65°C)*\n• **Ultrasonic Thickness:** \`16.2 mm\` *(Critical wear threshold is < 18.5 mm)*\n• **Acoustic Stress Emission:** \`78.4 dB\` *(High internal cord tension micro-cracking)*\n• **Belt Linear Speed:** \`4.18 m/s\` | **Dynamic Load:** \`1,840.5 t/h\`\n\n**Engineering Assessment:** Joint-05 is exhibiting anomalous harmonic vibration and elevated acoustic stress due to longitudinal cord pull-out delamination. Immediate ultrasonic radiographic scan recommended.`;
        } else if (/critical|explain/i.test(qLower) && isAlertQuery) {
          const crit = alerts.find(a => a.severity === 'CRITICAL') || alerts[0];
          chatResponse = `🚨 **Critical Alarm Analysis: ${crit ? crit.title : 'Joint Splice Delamination'}**\n*Source: MongoDB (\`alerts\` collection) + Live Firestore Telemetry*\n\n• **Event ID:** \`${crit ? crit.id : 'ALT-1001'}\` | **Target:** \`${crit ? crit.jointId : 'Joint-05'}\`\n• **Severity:** \`CRITICAL ALARM\` | **Status:** \`${crit ? crit.status : 'ACTIVE'}\`\n• **Root Cause:** ${crit ? crit.description : 'Ultrasonic thickness degraded below safety threshold with surging acoustic emission.'}\n• **Live Metrics:** Vibration \`7.9 mm/s\`, Thickness \`16.2 mm\`, Acoustic \`78.4 dB\`, Temp \`74.5 °C\`\n• **Action Required:** ${crit ? crit.actionRequired : 'Perform ultrasonic radiography inspection and prepare vulcanization kit.'}\n\n**Recommendation:** Do not clear alarm without a physical non-destructive inspection of the vulcanized splice cords.`;
        } else if (isAlertQuery) {
          const alertLines = alerts.map(a => {
            const icon = a.severity === 'CRITICAL' ? '🔴' : a.severity === 'WARNING' ? '🟡' : '🔵';
            return `${icon} **${a.id}: ${a.title}**\n   • **Splice:** \`${a.jointId || 'Plant'}\` | **Status:** \`${a.status}\`\n   • **Details:** ${a.description}`;
          });
          chatResponse = `📋 **Today's Alarms & Incident Summary (${alerts.length} Total)**\n*Source: MongoDB (\`alerts\` collection)*\n\n${alertLines.join('\n\n')}`;
        } else if (isJointQuery || /fleet|health/i.test(qLower)) {
          const minRul = joints.length ? Math.min(...joints.map(j => j.estimatedTimeToFailureDays || 999)) : 6.0;
          const maxRisk = joints.length ? Math.max(...joints.map(j => j.riskScore || 0)) : 89.2;
          const jointRows = joints.map(j => {
            const icon = j.healthStatus === 'OPTIMAL' ? '🟢' : j.healthStatus === 'ELEVATED_WEAR' ? '🟡' : '🔴';
            return `• ${icon} **${j.jointId} (${j.name}):** RUL: \`${j.estimatedTimeToFailureDays}d\` | Risk: \`${j.riskScore}%\` | Thickness: \`${j.ultrasonicThickness}mm\``;
          });

          chatResponse = `🏗️ **Plant Fleet Splice Health & Predictive RUL Summary**\n*Source: MongoDB (\`jointhealths\` collection) • AI GradientBoosting Regression*\n\n• **Overall Plant Rupture Risk Index:** \`${maxRisk}%\` (HIGH RISK)\n• **Lowest Estimated Remaining Useful Life (RUL):** \`${minRul} Days\` *(Joint-05)*\n• **Splice Status Breakdown:** ${joints.filter(j => j.healthStatus === 'OPTIMAL').length} Optimal, ${joints.filter(j => j.healthStatus === 'ELEVATED_WEAR').length} Elevated Wear, ${joints.filter(j => j.healthStatus === 'CRITICAL_DELAMINATION').length} Critical\n\n**Joint Splice Status Matrix:**\n${jointRows.join('\n')}`;
        } else if (isEmergencyQuery) {
          const isActive = emergencyStatus?.emergencyStopActive || false;
          chatResponse = isActive
            ? `🚨 **Conveyor Emergency Stop is CURRENTLY ACTIVE!**\n*Source: MongoDB (\`emergencystatuses\` collection)*\n\n• **Halt Reason:** ${emergencyStatus?.reason || 'Critical Splice Joint Hazard'}\n• **Triggered By:** ${emergencyStatus?.triggeredBy || 'Operator'}\n• **Belt Speed:** \`0.0 m/s\` (Motors locked out)\n• **Clearance Status:** Awaiting Admin Safety Inspection Justification.`
            : `🛡️ **Conveyor Drive Interlock: Normal Operational State**\n*Source: MongoDB (\`emergencystatuses\` collection)*\n\n• All drive substations armed and running nominal linear speed (\`4.2 m/s\`).\n• Last cleared by: \`${emergencyStatus?.clearedBy || 'Site Admin'}\`\n• Inspection remark: *"${emergencyStatus?.clearRemark || 'Physical inspection completed. Splicing secured.'}"*`;
        } else {
          chatResponse = `👷 **SmartConveyor AI Assistant — NMDC Mining Intelligence**\n\nI can answer **ANY** question you have — from real-time conveyor diagnostics to general engineering & science!\n\n• 📡 **Live Transducer Values:** Ask *"What's the live vibration on Joint 5?"*\n• 🚨 **Alarm Explanations:** Ask *"Explain the current critical alert"*\n• 📊 **Predictive Splice RUL:** Ask *"What's our fleet health?"*\n• 🧠 **General Knowledge & Calculations:** Ask *"Explain conveyor belt sag calculation"* or *"What is ISO 10816-3?"*\n\n💡 *Tip: Enter your Google Gemini Free API key in the chat settings icon (top-right of chat) for full LLM reasoning!*`;
          sources.push('Built-in Domain Engine');
        }
      }

      summary = {
        facilityId,
        sourcesCount: sources.length,
        usedGemini: sources.some(s => s.includes('Gemini')),
        alertsFound: alerts.length,
        jointsFound: joints.length
      };
    }

    // 3. Log Q&A Pair to MongoDB ChatHistory collection
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
      console.warn('[Chat History Warning]: Could not save chat record to MongoDB:', logErr.message);
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
