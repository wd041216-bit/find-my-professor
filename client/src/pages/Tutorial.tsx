import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, GraduationCap, Search, Heart, FileText, User, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/MobileNav";

const tutorialContent = {
  en: {
    title: "How to Use ProfMatch",
    subtitle: "Find your ideal research advisor in 4 simple steps",
    backToApp: "Back to App",
    steps: [
      {
        icon: User,
        color: "from-purple-500 to-indigo-500",
        badge: "Step 1",
        title: "Complete Your Profile",
        description: "Tell us about your academic background so we can find the best professor matches for you.",
        tips: [
          "Select your academic level (High School / Undergraduate / Graduate)",
          "Enter your target university and intended major",
          "Add your skills (e.g., Python, R, Statistics)",
          "Add your research interests (e.g., Machine Learning, Genomics)",
          "Upload your resume for automatic profile filling",
        ],
        note: "The more complete your profile, the more accurate your match scores will be.",
      },
      {
        icon: Search,
        color: "from-pink-500 to-rose-500",
        badge: "Step 2",
        title: "Explore Professors",
        description: "Browse professor cards and use filters to narrow down your search.",
        tips: [
          "Swipe right (or click ♥) to like a professor",
          "Swipe left (or click ✕) to skip",
          "Click the ℹ️ button to view detailed research info",
          "Use filters to narrow by university or research field",
          "The match score (%) shows how well you align with each professor",
        ],
        note: "Professors with higher match scores share more research interests with you.",
      },
      {
        icon: Heart,
        color: "from-orange-500 to-amber-500",
        badge: "Step 3",
        title: "Review Your Matches",
        description: "View all professors you've liked and manage your shortlist.",
        tips: [
          "Go to the Matches tab to see all liked professors",
          "View detailed research information for each match",
          "Remove professors you're no longer interested in",
          "Click 'Generate Letter' to create a personalized cover letter",
        ],
        note: "You can like as many professors as you want — there's no limit.",
      },
      {
        icon: FileText,
        color: "from-teal-500 to-cyan-500",
        badge: "Step 4",
        title: "Generate Cover Letters",
        description: "Create personalized application emails to send to professors.",
        tips: [
          "Go to the Letters tab to see all generated letters",
          "Each letter is tailored to the professor's specific research",
          "Choose a tone: Formal, Casual, or Enthusiastic",
          "Copy or download the letter to use in your email",
          "The letter content is always in English for professional use",
        ],
        note: "Always personalize the letter further before sending — add specific details about why you want to work with that professor.",
      },
    ],
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          q: "How is the match score calculated?",
          a: "The match score is based on the overlap between your skills/research interests and the professor's research tags. The more specific your profile, the more accurate the score.",
        },
        {
          q: "Can I change my profile after saving?",
          a: "Yes! Go to the Profile tab at any time to update your information. Your match scores will automatically recalculate.",
        },
        {
          q: "How many professors are available?",
          a: "ProfMatch currently has over 4,300 professors from 32 top US research universities, covering 15+ research fields.",
        },
        {
          q: "Is the cover letter ready to send?",
          a: "The generated letter is a strong starting point. We recommend personalizing it further — mention specific papers you've read, shared research goals, or why you're excited about their lab.",
        },
        {
          q: "What universities are included?",
          a: "We cover Harvard, MIT, Stanford, Yale, Princeton, Columbia, Cornell, UChicago, Duke, Northwestern, Johns Hopkins, UCLA, UMichigan, UWashington, and 18 more top research universities.",
        },
      ],
    },
    cta: {
      title: "Ready to Find Your Match?",
      subtitle: "Start exploring professors and discover your ideal research advisor.",
      button: "Start Exploring",
    },
  },
  zh: {
    title: "如何使用 ProfMatch",
    subtitle: "4 个简单步骤，找到你的理想科研导师",
    backToApp: "返回应用",
    steps: [
      {
        icon: User,
        color: "from-purple-500 to-indigo-500",
        badge: "第一步",
        title: "完善你的个人资料",
        description: "告诉我们你的学术背景，我们将为你匹配最合适的教授。",
        tips: [
          "选择你的学历阶段（高中 / 本科 / 研究生）",
          "填写目标大学和意向专业",
          "添加你的技能（如 Python、R、统计学）",
          "添加你的研究兴趣（如机器学习、基因组学）",
          "上传简历，系统可自动填充资料",
        ],
        note: "资料越完整，匹配分数越准确。",
      },
      {
        icon: Search,
        color: "from-pink-500 to-rose-500",
        badge: "第二步",
        title: "探索教授",
        description: "浏览教授卡片，使用筛选器缩小搜索范围。",
        tips: [
          "向右滑动（或点击 ♥）表示喜欢",
          "向左滑动（或点击 ✕）表示跳过",
          "点击 ℹ️ 按钮查看详细研究信息",
          "使用筛选器按大学或研究领域筛选",
          "匹配分数（%）显示你与每位教授的契合度",
        ],
        note: "匹配分数越高，说明该教授的研究方向与你的兴趣越吻合。",
      },
      {
        icon: Heart,
        color: "from-orange-500 to-amber-500",
        badge: "第三步",
        title: "管理你的匹配",
        description: "查看所有喜欢的教授，管理你的候选名单。",
        tips: [
          "进入「匹配」标签查看所有已喜欢的教授",
          "查看每位教授的详细研究信息",
          "移除不再感兴趣的教授",
          "点击「生成申请信」为该教授创建个性化申请邮件",
        ],
        note: "你可以喜欢任意数量的教授，没有上限。",
      },
      {
        icon: FileText,
        color: "from-teal-500 to-cyan-500",
        badge: "第四步",
        title: "生成申请信",
        description: "创建个性化的申请邮件，发送给目标教授。",
        tips: [
          "进入「申请信」标签查看所有已生成的信件",
          "每封信都根据教授的具体研究方向量身定制",
          "可选择语气：正式、轻松或热情",
          "复制或下载信件内容，用于发送邮件",
          "申请信内容为英文，适合专业学术场景",
        ],
        note: "发送前请进一步个性化信件内容——添加你读过的具体论文、共同的研究目标，或你对该实验室感兴趣的原因。",
      },
    ],
    faq: {
      title: "常见问题",
      items: [
        {
          q: "匹配分数是如何计算的？",
          a: "匹配分数基于你的技能/研究兴趣与教授研究标签的重叠程度。资料越详细，分数越准确。",
        },
        {
          q: "保存后还能修改资料吗？",
          a: "可以！随时进入「个人资料」标签更新信息，匹配分数会自动重新计算。",
        },
        {
          q: "平台上有多少位教授？",
          a: "ProfMatch 目前收录了来自 32 所美国顶尖研究型大学的 4300+ 位教授，涵盖 15+ 个研究领域。",
        },
        {
          q: "生成的申请信可以直接发送吗？",
          a: "生成的信件是一个很好的起点，但建议进一步个性化——提及你读过的具体论文、共同研究目标，或你对该实验室感兴趣的具体原因。",
        },
        {
          q: "平台覆盖哪些大学？",
          a: "包括哈佛、麻省理工、斯坦福、耶鲁、普林斯顿、哥伦比亚、康奈尔、芝加哥大学、杜克、西北大学、约翰斯·霍普金斯、UCLA、密歇根大学、华盛顿大学等 32 所顶尖研究型大学。",
        },
      ],
    },
    cta: {
      title: "准备好开始了吗？",
      subtitle: "开始探索教授，发现你的理想科研导师。",
      button: "开始探索",
    },
  },
};

export default function Tutorial() {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const content = isZh ? tutorialContent.zh : tutorialContent.en;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 pb-32 md:pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={isZh ? "/zh/swipe" : "/swipe"}>
            <Button variant="ghost" size="sm" className="hover:bg-purple-100 rounded-full gap-1">
              <ArrowLeft className="w-4 h-4" />
              {content.backToApp}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <span className="font-black text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">ProfMatch</span>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/70 rounded-full px-4 py-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-purple-700">{isZh ? '使用指南' : 'User Guide'}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            {content.title}
          </h1>
          <p className="text-gray-600 text-lg">{content.subtitle}</p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {content.steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="bg-white/90 backdrop-blur-sm shadow-lg rounded-3xl overflow-hidden border-0">
                <CardContent className="p-0">
                  {/* Step header */}
                  <div className={`bg-gradient-to-r ${step.color} p-5 flex items-center gap-4`}>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <Badge className="bg-white/20 text-white border-0 text-xs mb-1">{step.badge}</Badge>
                      <h2 className="text-xl font-black text-white">{step.title}</h2>
                      <p className="text-white/80 text-sm mt-0.5">{step.description}</p>
                    </div>
                  </div>
                  {/* Tips */}
                  <div className="p-5 space-y-3">
                    <ul className="space-y-2">
                      {step.tips.map((tip, tipIdx) => (
                        <li key={tipIdx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mt-3">
                      <span className="text-amber-500 text-base flex-shrink-0">💡</span>
                      <p className="text-amber-800 text-sm leading-relaxed">{step.note}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-gray-800">{content.faq.title}</h2>
          <div className="space-y-3">
            {content.faq.items.map((item, idx) => (
              <Card key={idx} className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl border-0 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-purple-50/50 transition-colors"
                >
                  <span className="font-bold text-gray-800 text-sm pr-4">{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 border-0 rounded-3xl shadow-xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-black text-white">{content.cta.title}</h2>
            <p className="text-white/80">{content.cta.subtitle}</p>
            <Link href={isZh ? "/zh/swipe" : "/swipe"}>
              <Button className="bg-white text-purple-700 hover:bg-white/90 font-bold rounded-full px-8 py-3 text-base shadow-lg gap-2">
                {content.cta.button}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </div>
  );
}
