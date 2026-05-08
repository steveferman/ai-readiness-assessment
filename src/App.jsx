import { useState, useRef } from 'react';
import {
  ArrowRight, Award, BarChart3, CheckCircle,
  Lightbulb, Mail, Printer, Send, Target, User,
} from 'lucide-react';

// ─── Netlify Forms backup (server-side, always reachable) ────────────────────
// Netlify intercepts the hidden form on page load and captures every fetch()
// submission — no extra service needed. Submissions appear in the Netlify
// dashboard under Site → Forms, and Netlify emails you each new entry.
async function saveToNetlifyForms(data) {
  try {
    const body = new URLSearchParams({
      'form-name':  'assessment-backup',
      firstName:    data.firstName,
      lastName:     data.lastName,
      email:        data.email,
      score:        String(data.scores?.totalScore ?? ''),
      percentage:   String(data.scores?.percentage  ?? ''),
      category:     data.categoryName ?? '',
      answers:      data.answers ?? '',
    });
    await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  } catch (err) {
    console.warn('Netlify Forms backup failed:', err);
  }
}

// ─── Assessment questions ─────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    text: "How involved is your leadership team in the company's AI initiatives?",
    options: [
      { key: 'A', text: "We're not yet actively involved in AI decisions", value: 1 },
      { key: 'B', text: 'We occasionally consider AI in leadership discussions', value: 2 },
      { key: 'C', text: 'Leadership is involved in specific AI projects', value: 3 },
      { key: 'D', text: 'Leadership drives AI strategy as part of overall business goals', value: 4 },
    ],
  },
  {
    id: 2,
    text: 'Have you used AI tools as a strategic partner in making key business decisions?',
    options: [
      { key: 'A', text: 'No, we primarily use AI for operational or task-based purposes', value: 1 },
      { key: 'B', text: "We've started using AI to support decision-making, but it's not regular", value: 2 },
      { key: 'C', text: 'We occasionally use AI for strategic decisions', value: 3 },
      { key: 'D', text: 'Yes, AI is a core part of how we approach key business decisions', value: 4 },
    ],
  },
  {
    id: 3,
    text: 'How well integrated is AI into your core business processes?',
    options: [
      { key: 'A', text: "AI hasn't been fully integrated yet", value: 1 },
      { key: 'B', text: "We've implemented AI in some areas, but not across the business", value: 2 },
      { key: 'C', text: 'AI is integrated into several key business processes', value: 3 },
      { key: 'D', text: 'AI is a fundamental part of how we operate', value: 4 },
    ],
  },
  {
    id: 4,
    text: "Have you experienced any 'aha' moments where AI revealed new opportunities or solutions that you hadn't considered before?",
    options: [
      { key: 'A', text: "Not yet, we're still exploring AI's potential", value: 1 },
      { key: 'B', text: "Yes, we've had some moments, but haven't fully capitalized on them", value: 2 },
      { key: 'C', text: "We've had those moments and are starting to leverage them", value: 3 },
      { key: 'D', text: "Absolutely, and we're using AI to create new value regularly", value: 4 },
    ],
  },
  {
    id: 5,
    text: "How do you currently view AI's role in your business?",
    options: [
      { key: 'A', text: 'Mostly as an operational tool to increase efficiency', value: 1 },
      { key: 'B', text: "It's starting to play a more strategic role", value: 2 },
      { key: 'C', text: 'AI is becoming central to both operational and strategic decisions', value: 3 },
      { key: 'D', text: 'AI is a key driver of both strategy and innovation for us', value: 4 },
    ],
  },
  {
    id: 6,
    text: 'Have you implemented AI solutions that address high-impact, strategic problems?',
    options: [
      { key: 'A', text: "No, we've mostly focused on smaller, tactical issues", value: 1 },
      { key: 'B', text: "We're starting to apply AI to more impactful areas, but it's early", value: 2 },
      { key: 'C', text: "Yes, we've used AI for some larger strategic problems", value: 3 },
      { key: 'D', text: 'Yes, AI has been instrumental in solving key strategic challenges', value: 4 },
    ],
  },
  {
    id: 7,
    text: "How confident are you in measuring the ROI of your AI initiatives?",
    options: [
      { key: 'A', text: "We don't have clear metrics to measure AI's impact yet", value: 1 },
      { key: 'B', text: "We're tracking some basic results, but not systematically", value: 2 },
      { key: 'C', text: "We measure ROI in some areas, but there's room for improvement", value: 3 },
      { key: 'D', text: "We have clear metrics and measure AI's impact across the business", value: 4 },
    ],
  },
  {
    id: 8,
    text: 'Have you explored using custom AI models (such as GPT or other equivalents) to solve unique business challenges?',
    options: [
      { key: 'A', text: "No, we haven't explored that yet", value: 1 },
      { key: 'B', text: "We've considered it but haven't implemented anything", value: 2 },
      { key: 'C', text: "We've experimented with custom models in some areas", value: 3 },
      { key: 'D', text: 'Yes, we regularly use custom AI models for unique challenges', value: 4 },
    ],
  },
  {
    id: 9,
    text: 'Are your AI initiatives driven from the top down, with clear leadership involvement?',
    options: [
      { key: 'A', text: 'No, AI initiatives are mostly driven at the department level', value: 1 },
      { key: 'B', text: "Leadership is involved, but there's no consistent direction", value: 2 },
      { key: 'C', text: 'Leadership is somewhat involved, but more could be done', value: 3 },
      { key: 'D', text: 'Yes, leadership actively drives AI initiatives and aligns them with strategy', value: 4 },
    ],
  },
  {
    id: 10,
    text: "Have you coordinated AI efforts across departments, or is AI used in silos?",
    options: [
      { key: 'A', text: "AI is used in silos, and there's no coordination", value: 1 },
      { key: 'B', text: "We're starting to coordinate efforts, but it's early", value: 2 },
      { key: 'C', text: 'Some departments are aligned, but not all', value: 3 },
      { key: 'D', text: 'AI is fully coordinated across departments, driving cohesive results', value: 4 },
    ],
  },
];

// ─── Score categories ─────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    name: 'Emerging AI Potential',
    range: [0, 18],
    title: "You're just beginning to explore AI's potential and how it can impact your business.",
    insight: "Your AI efforts are still in the early stages, and you're likely only using AI for basic tasks. There's significant room to grow, both in mindset and impact.",
    message: [
      "You've started on the AI journey, but there's a lot more opportunity to leverage AI strategically.",
      "Let's explore how AI can drive greater impact and help you move from experimentation to strategic deployment.",
    ],
    cta: "Let's talk about building a strategic AI roadmap to create real business value.",
    icon: <Lightbulb size={48} className="text-yellow-500" />,
    color: 'yellow',
  },
  {
    name: 'Developing AI Strategy',
    range: [19, 28],
    title: "Your business is beginning to align AI with broader goals, but there's room to scale and deepen its strategic role.",
    insight: "You're making progress with AI, but it's not yet a core part of your leadership's decision-making process or your broader strategy. You're in a good position to take AI further.",
    message: [
      "You've made strides with AI, but there's still a lot more value to unlock by aligning it more closely with strategic goals.",
      "Let's work on making AI a more central driver of growth and efficiency.",
    ],
    cta: "Let's discuss how to align your AI initiatives with your key business objectives for bigger results.",
    icon: <BarChart3 size={48} className="text-blue-500" />,
    color: 'blue',
  },
  {
    name: 'Strategic AI Alignment',
    range: [29, 38],
    title: "AI is playing a significant role in your business, but there's still room to fully integrate it across the organization.",
    insight: "AI is already driving meaningful results, but you're not yet fully capitalizing on its potential. There's room to scale and better integrate AI across departments.",
    message: [
      "AI is making a real impact, but to unlock its full potential, you need to deepen its integration across all key business areas.",
      "Let's work on scaling your AI initiatives and ensuring they're delivering maximum value.",
    ],
    cta: "Let's explore how you can fully integrate AI into your business to drive even more strategic growth.",
    icon: <Target size={48} className="text-purple-500" />,
    color: 'purple',
  },
  {
    name: 'AI-Empowered Leadership',
    range: [39, 44],
    title: "Your business is leading with AI, leveraging it as a key driver of strategy, growth, and innovation.",
    insight: "AI is fully integrated into your leadership strategy and decision-making process, delivering measurable business results. You're ahead of the curve, and AI is empowering your team to drive even more innovation.",
    message: [
      "You're using AI as a true strategic asset, empowering your leadership to make informed, high-impact decisions that fuel growth.",
      "Let's explore how to continue innovating and expanding AI's role in your business to maintain your leadership position.",
    ],
    cta: "Let's discuss how to keep your business at the forefront of AI-powered innovation and growth.",
    icon: <Award size={48} className="text-emerald-500" />,
    color: 'emerald',
  },
];

// ─── Action items by score ────────────────────────────────────────────────────
function getActionItems(score) {
  if (score <= 18) return [
    "Start with a focused AI pilot project in one high-impact area",
    "Educate leadership on AI's strategic potential beyond operational efficiency",
    "Identify key metrics to measure AI's impact on business outcomes",
    "Develop a basic AI roadmap aligned with your business objectives",
  ];
  if (score <= 28) return [
    "Align AI initiatives with your strategic business priorities",
    "Increase leadership involvement in AI strategy development",
    "Implement a structured approach to measuring AI ROI",
    "Begin coordinating AI efforts across departments",
  ];
  if (score <= 38) return [
    "Develop a comprehensive AI governance framework",
    "Scale successful AI initiatives across the organization",
    "Explore advanced AI applications for strategic advantage",
    "Implement cross-functional AI teams to drive innovation",
  ];
  return [
    "Develop an AI innovation lab to explore cutting-edge applications",
    "Create an AI center of excellence to share best practices",
    "Explore strategic partnerships to further enhance AI capabilities",
    "Develop a long-term AI vision that positions your company as an industry leader",
  ];
}

// ─── Follow-up email sequence ─────────────────────────────────────────────────
function getEmailSequence(category, score, firstName) {
  return [
    {
      day: 1,
      subject: 'Your AI Readiness & Impact Audit Results',
      content: `Hi ${firstName},

Thanks for completing the AI Readiness & Impact Audit! Based on your responses, here's your result:

• Your Score: ${score}
• Category: ${category.name}

${category.insight}

You're making great progress in leveraging AI, but there's still a significant opportunity to enhance its strategic impact on your business. I'd love to discuss how you can take AI to the next level and drive even more growth.`,
      cta: 'Book a Call to Explore AI Strategy',
    },
    {
      day: 3,
      subject: "3 Ways to Maximize AI's Strategic Impact",
      content: `Hi ${firstName},

Now that you've reviewed your AI Readiness & Impact results, here are three ways you can deepen AI's strategic role in your business:

1. Align AI with core leadership goals: AI should be central to decision-making, not just an operational tool.

2. Expand AI across departments: Scaling AI beyond silos creates a cohesive, company-wide impact.

3. Focus on measurable results: Ensure AI initiatives drive clear, quantifiable business outcomes.

Let's discuss how you can implement these strategies and take AI further.`,
      cta: 'Schedule a Call',
    },
    {
      day: 5,
      subject: "Don't Miss Out on AI's Full Potential",
      content: `Hi ${firstName},

Many businesses are just scratching the surface of AI's potential. With your current efforts, you're well on your way, but there's so much more you can achieve.

Let's explore how to continue growing your AI initiatives and ensure they drive real, measurable impact for your business.`,
      cta: "Let's Talk AI Strategy",
    },
  ];
}

// ─── Color scheme helper ──────────────────────────────────────────────────────
function colorScheme(color) {
  const schemes = {
    yellow: { bg: 'bg-yellow-600', text: 'text-yellow-600', border: 'border-yellow-600', light: 'bg-yellow-50' },
    blue:   { bg: 'bg-blue-600',   text: 'text-blue-600',   border: 'border-blue-600',   light: 'bg-blue-50'   },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50' },
    emerald:{ bg: 'bg-emerald-600',text: 'text-emerald-600',border: 'border-emerald-600',light: 'bg-emerald-50'},
  };
  return schemes[color] || schemes.blue;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function App() {
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [answers,     setAnswers]     = useState({});
  const [showResults,    setShowResults]    = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [showPreview,    setShowPreview]    = useState(false);
  const [previewIdx,     setPreviewIdx]     = useState(0);
  const [sendingPreview, setSendingPreview] = useState(false);
  const printRef = useRef(null);

  // ── Scoring ────────────────────────────────────────────────────────────────
  function calculateScores() {
    let total = 0, answered = 0;
    QUESTIONS.forEach(q => {
      const key = answers[q.id];
      if (key) {
        const opt = q.options.find(o => o.key === key);
        if (opt) { total += opt.value; answered++; }
      }
    });
    return {
      totalScore: total,
      answeredQuestions: answered,
      maxPossibleScore: QUESTIONS.length * 4,
      percentage: Math.round((total / (QUESTIONS.length * 4)) * 100),
    };
  }

  function getCategory(score) {
    return CATEGORIES.find(c => score >= c.range[0] && score <= c.range[1]) || CATEGORIES[0];
  }

  function buildAnswersJSON() {
    return QUESTIONS.map((q, i) => {
      const key = answers[q.id];
      const opt = q.options.find(o => o.key === key);
      const answer = opt ? `${opt.key}. ${opt.text}` : 'Not answered';
      return `Q${i + 1}: ${q.text}\nA${i + 1}: ${answer}`;
    }).join('\n\n');
  }

  function isFormValid() {
    return (
      firstName.trim() !== '' &&
      lastName.trim()  !== '' &&
      email.trim()     !== '' &&
      email.includes('@') &&
      Object.keys(answers).length === QUESTIONS.length
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    const scores      = calculateScores();
    const category    = getCategory(scores.totalScore);
    const answersJSON = buildAnswersJSON();

    // Post to Netlify Forms — Netlify captures it server-side and
    // emails Steve.ferman@etegrity.net automatically on every submission.
    await saveToNetlifyForms({
      firstName, lastName, email,
      answers: answersJSON,
      scores,
      categoryName: category.name,
    });

    setIsLoading(false);
    setShowResults(true);
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  function handlePrint() { window.print(); }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function handleReset() {
    setFirstName(''); setLastName(''); setEmail('');
    setAnswers({}); setShowResults(false); setIsLoading(false);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Simulate preview "send" ────────────────────────────────────────────────
  function handlePreviewSend() {
    setSendingPreview(true);
    setTimeout(() => { setSendingPreview(false); }, 2000);
  }

  // ──────────────────────────────────────────────────────────────────────────
  const scores   = calculateScores();
  const category = getCategory(scores.totalScore);
  const C        = colorScheme(category.color);
  const emailSeq = getEmailSequence(category, scores.totalScore, firstName);

  // ── Email preview screen ───────────────────────────────────────────────────
  if (showPreview) {
    const preview = emailSeq[previewIdx];
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Email Preview</h2>
                  <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <div className="text-sm text-gray-500">From: Your Company</div>
                  <div className="text-sm text-gray-500">To: {email}</div>
                  <div className="text-sm text-gray-500">Subject: {preview.subject}</div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="prose max-w-none">
                    {preview.content.split('\n\n').map((p, i) => (
                      <p key={i} className="mb-4">{p}</p>
                    ))}
                  </div>
                  <div className="mt-6">
                    <button className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${C.bg} hover:opacity-90`}>
                      {preview.cta}
                    </button>
                  </div>
                  <div className="mt-8 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <p>Best regards,</p>
                    <p>Steve</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                <div className="flex space-x-2">
                  {emailSeq.map((_, i) => (
                    <button key={i} onClick={() => setPreviewIdx(i)}
                      className={`w-2 h-2 rounded-full ${previewIdx === i ? C.bg : 'bg-gray-300'}`}
                      aria-label={`Email ${i + 1}`} />
                  ))}
                </div>
                <button onClick={handlePreviewSend} disabled={sendingPreview}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${sendingPreview ? 'bg-green-600 text-white' : `${C.bg} text-white hover:opacity-90`} focus:outline-none`}>
                  {sendingPreview
                    ? <><CheckCircle className="w-4 h-4 mr-2" /> Sent!</>
                    : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
                </button>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => setShowPreview(false)} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                Back to Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto" ref={printRef}>

            {/* Results card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden print-page-1">
              <div className={`${C.bg} p-6 text-white`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-3xl font-bold">AI Readiness Assessment Results</h1>
                    <p className="mt-2">Thank you for completing the assessment, {firstName} {lastName}!</p>
                    <p className="mt-1 text-sm opacity-80">Your results have been sent to our team for review.</p>
                  </div>
                  <button onClick={handlePrint}
                    className="print:hidden flex items-center px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg text-white transition-colors">
                    <Printer className="w-5 h-5 mr-2" /> Print Report
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Category icon & name */}
                <div className="mb-8 text-center">
                  <div className={`inline-flex items-center justify-center p-5 ${C.light} rounded-full mb-4`}>
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{category.name}</h2>
                  <p className="text-xl text-gray-700">{category.title}</p>
                </div>

                {/* Score bar */}
                <div className={`${C.light} rounded-lg p-6 mb-8`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">AI Readiness Score</span>
                    <span className={`text-sm font-medium ${C.text}`}>{scores.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`${C.bg} h-2.5 rounded-full`} style={{ width: `${scores.percentage}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Score: {scores.totalScore} out of {scores.maxPossibleScore} points
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Key Insight */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Key Insight</h3>
                    <p className="text-gray-700">{category.insight}</p>
                  </div>

                  {/* What This Means */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">What This Means For Your Business</h3>
                    <div className="space-y-3">
                      {category.message.map((msg, i) => (
                        <p key={i} className="text-gray-700">{msg}</p>
                      ))}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className={`p-6 border ${C.border} border-l-4 rounded-lg bg-white`}>
                    <h4 className={`font-semibold ${C.text} mb-2`}>Next Steps</h4>
                    <p className="text-gray-800">{category.cta}</p>
                    <div className="mt-4">
                      <a href="https://www.calendly.com/steve-ferman" target="_blank" rel="noopener noreferrer"
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${C.bg} hover:opacity-90`}>
                        Book Time
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action plan card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8 page-break print-page-2">
              <div className={`${C.bg} p-6 text-white`}>
                <h1 className="text-2xl font-bold">Recommended Actions & Next Steps</h1>
                <p className="mt-2 opacity-80">Detailed action plan for {firstName} {lastName}</p>
              </div>
              <div className="p-8">
                <div className="space-y-8">

                  {/* Recommended actions */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Recommended Actions</h3>
                    <ul className="space-y-3">
                      {getActionItems(scores.totalScore).map((item, i) => (
                        <li key={i} className="flex items-start">
                          <ArrowRight size={20} className={`${C.text} mr-2 mt-0.5 flex-shrink-0`} />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Summary */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Assessment Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Score</p>
                          <p className="text-2xl font-bold text-gray-800">{scores.totalScore}/{scores.maxPossibleScore}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Percentage</p>
                          <p className="text-2xl font-bold text-gray-800">{scores.percentage}%</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Category</p>
                        <p className="text-lg font-semibold text-gray-800">{category.name}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 hidden print:block">
                      Schedule a call: https://www.calendly.com/steve-ferman
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Contact Information</h3>
                    <div className={`p-6 ${C.light} rounded-lg`}>
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">Ready to Take the Next Step?</h4>
                        <p className="text-gray-700 mb-4">Schedule a consultation to discuss your AI strategy</p>
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-gray-800">4 Pillar Coach</p>
                          <p className="text-gray-700">973-435-0700</p>
                          <p className="text-gray-700">www.4pillarcoach.com</p>
                          <p className="text-gray-700">steve@4pillarcoach.com</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div className="mt-8 flex justify-center space-x-4 print:hidden">
              <button onClick={handleReset}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${C.bg} hover:opacity-90`}>
                Take Assessment Again
              </button>
              <button onClick={handlePrint}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${C.bg} hover:opacity-90`}>
                <Printer className="w-5 h-5 mr-2" /> Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Assessment form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Readiness & Impact Audit</h1>
            <p className="text-xl text-gray-600">
              Discover how effectively your business is leveraging AI and uncover opportunities for strategic growth.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-8">
              {/* Contact fields */}
              <div className="grid grid-cols-1 gap-6 mb-8">
                {[
                  { id: 'firstName', label: 'First Name', value: firstName, setter: setFirstName, placeholder: 'Enter your first name', icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
                  { id: 'lastName',  label: 'Last Name',  value: lastName,  setter: setLastName,  placeholder: 'Enter your last name',  icon: <User className="h-5 w-5 text-gray-400" />, type: 'text' },
                  { id: 'email',     label: 'Email Address', value: email, setter: setEmail, placeholder: 'Enter your email address', icon: <Mail className="h-5 w-5 text-gray-400" />, type: 'email' },
                ].map(f => (
                  <div key={f.id}>
                    <label htmlFor={f.id} className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{f.icon}</div>
                      <input
                        type={f.type} id={f.id} value={f.value}
                        onChange={ev => f.setter(ev.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={f.placeholder} required
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-8">
                {QUESTIONS.map(q => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{q.id}. {q.text}</h3>
                    <div className="space-y-4">
                      {q.options.map(opt => (
                        <div key={opt.key} className="flex items-center">
                          <input
                            type="radio" id={`${q.id}-${opt.key}`} name={`question-${q.id}`}
                            value={opt.key} checked={answers[q.id] === opt.key}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor={`${q.id}-${opt.key}`} className="ml-3 block text-sm font-medium text-gray-700">
                            {opt.key}. {opt.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="mt-8">
                <button type="submit" disabled={!isFormValid() || isLoading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isFormValid() && !isLoading ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' : 'bg-gray-400 cursor-not-allowed'}`}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : 'Submit Assessment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
