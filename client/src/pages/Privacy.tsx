import { Link } from 'wouter';
import { Shield, Heart, Eye, Lock, Users, Mail, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pb-32 md:pb-24">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Find My Professor
              </span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost">返回首页</Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            隐私政策
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            最后更新：2026年2月11日
          </p>
        </div>

        {/* Privacy Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 space-y-10">
          {/* Introduction */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-bold text-gray-900">我们的承诺</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              <p className="mb-4">
                在Find My Professor，<strong>您的隐私和信任是我们的首要任务</strong>。我们深知您分享的学术背景和研究兴趣是您个人的宝贵信息，我们承诺以最高标准保护这些数据。
              </p>
              <p className="mb-4">
                我们相信<strong>透明度</strong>是建立信任的基础。本隐私政策将清晰地告诉您：我们收集哪些信息、为什么收集、如何使用，以及您拥有哪些控制权。
              </p>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <p className="font-semibold text-purple-900">
                  💜 核心原则：我们永远不会出售您的个人信息，也不会将其用于您未明确同意的目的。
                </p>
              </div>
            </div>
          </section>

          {/* What We Collect */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">我们收集哪些信息</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 text-gray-900">1. 您主动提供的信息</h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span><strong>账户信息</strong>：通过Manus OAuth登录时的基本账户信息（用户名、邮箱）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span><strong>学术档案</strong>：您填写的教育背景、研究兴趣、目标大学等信息</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span><strong>使用偏好</strong>：您对教授的喜欢/跳过选择，用于改进匹配算法</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 text-gray-900">2. 自动收集的信息</h3>
                <ul className="space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span><strong>使用数据</strong>：访问时间、使用功能、交互行为（用于改进产品体验）</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    <span><strong>设备信息</strong>：浏览器类型、操作系统、IP地址（用于安全防护和错误诊断）</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-3 text-green-900">✅ 我们不收集的信息</h3>
                <ul className="space-y-2 ml-6 text-green-800">
                  <li className="flex items-start gap-2">
                    <span>❌</span>
                    <span>不收集您的精确地理位置</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>❌</span>
                    <span>不访问您的通讯录或照片</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>❌</span>
                    <span>不追踪您在其他网站的行为</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>❌</span>
                    <span>不使用第三方广告追踪器</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">我们如何使用您的信息</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                我们收集的信息<strong>仅用于以下明确目的</strong>，绝不用于其他用途：
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="font-bold mb-2 text-purple-900">🎯 核心功能</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 为您匹配合适的教授</li>
                    <li>• 生成个性化推荐信</li>
                    <li>• 保存您的匹配历史</li>
                  </ul>
                </div>
                <div className="bg-pink-50 rounded-xl p-5">
                  <h3 className="font-bold mb-2 text-pink-900">📈 产品改进</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 优化匹配算法准确性</li>
                    <li>• 改善用户界面体验</li>
                    <li>• 修复技术问题</li>
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-xl p-5">
                  <h3 className="font-bold mb-2 text-orange-900">🔒 安全保护</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 防止欺诈和滥用</li>
                    <li>• 保护账户安全</li>
                    <li>• 遵守法律要求</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="font-bold mb-2 text-blue-900">📧 必要通知</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• 发送重要更新通知</li>
                    <li>• 回复您的咨询</li>
                    <li>• 提供技术支持</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900">数据安全措施</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                我们采用<strong>行业标准的安全措施</strong>保护您的数据：
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">加密传输</h3>
                  <p className="text-sm">所有数据通过HTTPS加密传输</p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-pink-500 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">安全存储</h3>
                  <p className="text-sm">数据库采用加密存储和访问控制</p>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-purple-50 rounded-xl">
                  <div className="w-12 h-12 mx-auto mb-3 bg-orange-500 rounded-full flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-2">最小权限</h3>
                  <p className="text-sm">仅授权人员可访问必要数据</p>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900">您的权利</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                您对自己的数据拥有<strong>完全的控制权</strong>：
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl space-y-3">
                <div>
                  <h3 className="font-bold mb-1">📝 访问权</h3>
                  <p className="text-sm">随时在Profile页面查看和编辑您的个人信息</p>
                </div>
                <div>
                  <h3 className="font-bold mb-1">🗑️ 删除权</h3>
                  <p className="text-sm">您可以随时删除您的账户和所有相关数据（联系support@findmyprofessor.xyz）</p>
                </div>
                <div>
                  <h3 className="font-bold mb-1">📤 导出权</h3>
                  <p className="text-sm">您可以请求导出您的所有数据副本</p>
                </div>
                <div>
                  <h3 className="font-bold mb-1">🚫 拒绝权</h3>
                  <p className="text-sm">您可以拒绝某些数据处理活动（如营销邮件）</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-pink-500" />
              <h2 className="text-2xl font-bold text-gray-900">数据共享</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <div className="bg-pink-50 border-l-4 border-pink-500 p-6 rounded-r-xl">
                <p className="font-bold text-pink-900 mb-3">
                  🔒 我们承诺：绝不出售您的个人信息
                </p>
                <p className="leading-relaxed">
                  我们仅在以下<strong>极少数情况</strong>下与第三方共享数据：
                </p>
                <ul className="mt-3 space-y-2 ml-6">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span><strong>服务提供商</strong>：如云存储服务（Manus平台）、AI服务（用于生成推荐信），这些服务商受严格的保密协议约束</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span><strong>法律要求</strong>：当法律明确要求时（如法院传票），我们会尽力通知您</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-1">•</span>
                    <span><strong>您的同意</strong>：在获得您明确同意的情况下</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Children's Privacy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-gray-900">未成年人保护</h2>
            </div>
            <div className="text-gray-700">
              <p className="leading-relaxed">
                我们的服务面向<strong>18岁及以上</strong>的用户。如果您未满18岁，请在家长或监护人的指导下使用本服务。我们不会故意收集未成年人的个人信息。
              </p>
            </div>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">政策更新</h2>
            </div>
            <div className="text-gray-700">
              <p className="leading-relaxed mb-4">
                我们可能会不时更新本隐私政策。如有重大变更，我们会通过以下方式通知您：
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>在应用内显示醒目通知</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>通过邮件通知（如果您提供了邮箱）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>在本页面顶部更新"最后更新"日期</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">联系我们</h2>
              <p className="text-gray-700 mb-6 leading-relaxed">
                如果您对本隐私政策有任何疑问、建议或需要行使您的权利，请随时联系我们：
              </p>
              <div className="space-y-2 text-gray-800">
                <p className="font-semibold">📧 邮箱：support@findmyprofessor.xyz</p>
                <p className="text-sm text-gray-600">我们承诺在48小时内回复您的咨询</p>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              感谢您信任Find My Professor。我们将继续努力保护您的隐私，为您提供更好的服务。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
