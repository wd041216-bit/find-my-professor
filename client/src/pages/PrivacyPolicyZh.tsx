import { Link } from "wouter";

export default function PrivacyPolicyZh() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">隐私政策</h1>
        <Link href="/privacy-policy" className="text-blue-600 hover:underline">
          English
        </Link>
      </div>
      
      <div className="prose prose-slate max-w-none">
        <p className="text-sm text-gray-600 mb-6">
          <strong>版本:</strong> 1.0<br />
          <strong>生效日期:</strong> 2026年2月26日<br />
          <strong>最后更新:</strong> 2026年2月26日
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 引言</h2>
          <p>
            欢迎使用 ProfMatch！我们重视您的隐私，并致力于保护您的个人信息。本隐私政策详细说明了我们如何收集、使用、存储和保护您的数据。
          </p>
          <p className="font-semibold mt-4">
            重要提示：使用 ProfMatch 即表示您同意本隐私政策的所有条款。如果您不同意，请勿使用本服务。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 我们收集的信息</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 学生用户信息</h3>
          
          <h4 className="text-lg font-semibold mb-2">必需信息（用于账号创建和服务提供）：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>身份信息：</strong>姓名、邮箱地址、手机号码</li>
            <li><strong>认证信息：</strong>Apple ID、Google 账号（如果选择第三方登录）</li>
            <li><strong>学术背景：</strong>
              <ul className="list-circle pl-6 mt-2">
                <li>当前教育阶段（本科、硕士、博士等）</li>
                <li>就读或毕业院校</li>
                <li>专业/研究方向</li>
                <li>GPA（可选）</li>
                <li>研究兴趣和目标</li>
              </ul>
            </li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">使用数据（自动收集）：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>匹配行为：</strong>喜欢/不喜欢的教授记录</li>
            <li><strong>匹配历史：</strong>已匹配的教授列表</li>
            <li><strong>生成内容：</strong>AI 生成的求职信草稿</li>
            <li><strong>设备信息：</strong>设备型号、操作系统版本、应用版本</li>
            <li><strong>使用统计：</strong>登录时间、使用频率、功能使用情况</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">不收集的信息：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>❌ 精确地理位置（不使用 GPS 追踪）</li>
            <li>❌ 联系人列表</li>
            <li>❌ 照片和媒体文件（除非用户主动上传）</li>
            <li>❌ 支付信息（如未来添加付费功能，将使用第三方支付处理）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3 mt-6">2.2 教授信息（仅公开数据）</h3>
          
          <h4 className="text-lg font-semibold mb-2">我们收集的教授信息来源：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>大学官方网站（教师名录、院系页面）</li>
            <li>公开的学术数据库（Google Scholar、ResearchGate 等）</li>
            <li>学术出版物和会议论文</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">教授信息内容：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>✅ 姓名</li>
            <li>✅ 所在大学和院系</li>
            <li>✅ 研究方向/领域</li>
            <li>✅ 学术职称（教授、副教授等）</li>
            <li>❌ <strong>不收集：</strong>教授照片、个人联系方式（邮箱、电话）、家庭住址、私人社交媒体账号</li>
          </ul>

          <p className="font-semibold mt-4">
            重要说明：我们仅使用公开可获取的学术信息，不侵犯教授的隐私权。教授可以随时请求移除其信息（见"教授退出机制"）。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 我们如何使用您的信息</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 服务提供</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>教授匹配：</strong>根据您的研究兴趣和学术背景，推荐相关教授</li>
            <li><strong>个性化推荐：</strong>优化匹配算法，提高推荐准确性</li>
            <li><strong>AI 内容生成：</strong>使用您的个人资料生成定制化的求职信草稿</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.2 服务改进</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>数据分析：</strong>分析用户行为，改进应用功能和用户体验</li>
            <li><strong>Bug 修复：</strong>诊断和解决技术问题</li>
            <li><strong>功能开发：</strong>根据用户反馈开发新功能</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 通信</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>服务通知：</strong>账号相关通知、系统更新、安全警报</li>
            <li><strong>营销信息：</strong>新功能介绍、使用技巧（可选，用户可随时退订）</li>
            <li><strong>客户支持：</strong>回复用户咨询和投诉</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.4 法律合规</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>法律要求：</strong>遵守适用的法律法规（如 GDPR、CCPA）</li>
            <li><strong>安全保护：</strong>防止欺诈、滥用和非法活动</li>
            <li><strong>权利保护：</strong>保护 ProfMatch 和用户的合法权益</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 数据共享与披露</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 我们不出售您的数据</h3>
          <p className="font-semibold">
            明确承诺：ProfMatch 绝不向第三方出售、出租或交易您的个人信息。
          </p>

          <h3 className="text-xl font-semibold mb-3 mt-6">4.2 有限的数据共享</h3>
          <p>我们仅在以下情况下共享数据：</p>
          
          <h4 className="text-lg font-semibold mb-2 mt-4">服务提供商（必要时）：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>云服务提供商：</strong>用于数据存储和服务器托管（如 AWS、Google Cloud）</li>
            <li><strong>AI 服务提供商：</strong>用于生成求职信内容（数据经过匿名化处理）</li>
            <li><strong>分析工具：</strong>用于应用性能监控和崩溃报告（如 Sentry、Google Analytics）</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">法律要求：</h4>
          <ul className="list-disc pl-6 mb-4">
            <li>响应法院命令、传票或其他法律程序</li>
            <li>遵守政府机构的合法请求</li>
            <li>保护 ProfMatch 和用户的合法权益</li>
          </ul>

          <h4 className="text-lg font-semibold mb-2">业务转让：</h4>
          <p className="mb-4">
            如果 ProfMatch 被收购、合并或出售资产，您的数据可能作为交易的一部分转让（我们会提前通知您）
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 匿名化数据</h3>
          <p>
            我们可能会共享<strong>匿名化和聚合数据</strong>用于研究和分析，这些数据无法识别个人身份。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 您的权利（GDPR 和 CCPA 合规）</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 访问权</h3>
          <p>您有权随时查看我们存储的您的个人信息。</p>
          <p className="font-semibold">如何行使：在应用中，前往"个人资料" → "法律与支持" → "请求我的数据"</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.2 更正权</h3>
          <p>您有权更正不准确或不完整的个人信息。</p>
          <p className="font-semibold">如何行使：在应用中编辑您的个人资料</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.3 删除权（"被遗忘权"）</h3>
          <p>您有权要求删除您的个人数据。</p>
          <p className="font-semibold">如何行使：在应用中，前往"个人资料" → "删除账号"，或发送邮件至 s20316.wei@stu.scie.com.cn</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.4 数据可携带权</h3>
          <p>您有权以结构化、常用和机器可读的格式接收您的个人数据。</p>
          <p className="font-semibold">如何行使：发送邮件至 s20316.wei@stu.scie.com.cn 请求数据导出</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">5.5 反对权</h3>
          <p>您有权反对我们出于营销目的处理您的个人数据。</p>
          <p className="font-semibold">如何行使：在应用中关闭推送通知，或在营销邮件中点击"取消订阅"</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. 数据安全</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 技术措施</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>加密传输：</strong>所有数据传输使用 TLS/SSL 加密</li>
            <li><strong>加密存储：</strong>敏感数据（如密码）使用行业标准加密算法存储</li>
            <li><strong>访问控制：</strong>严格限制员工对用户数据的访问</li>
            <li><strong>安全审计：</strong>定期进行安全审计和漏洞扫描</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.2 组织措施</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>员工培训：</strong>所有员工接受数据保护和隐私培训</li>
            <li><strong>保密协议：</strong>员工签署保密协议，禁止未经授权访问或披露用户数据</li>
            <li><strong>事件响应：</strong>建立数据泄露应急响应计划</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.3 用户责任</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>密码安全：</strong>请使用强密码并定期更换</li>
            <li><strong>设备安全：</strong>保护您的设备免受未经授权的访问</li>
            <li><strong>可疑活动：</strong>如果您发现账号异常活动，请立即联系我们</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 儿童隐私</h2>
          <p className="font-semibold">年龄限制：ProfMatch 仅面向 13 岁及以上的用户。</p>
          <p className="mt-4">
            我们不会故意收集 13 岁以下儿童的个人信息。如果您是家长或监护人，并且发现您的孩子向我们提供了个人信息，请联系我们，我们将立即删除该信息。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. 国际数据传输</h2>
          <p>
            ProfMatch 的服务器可能位于您所在国家/地区以外的地方。通过使用我们的服务，您同意将您的数据传输到这些地区。我们会采取适当措施确保您的数据在传输过程中得到保护。
          </p>
          <p className="mt-4">
            <strong>欧盟用户：</strong>我们遵守 GDPR 的数据传输要求，使用标准合同条款（SCC）或其他合法机制进行数据传输。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. 政策更新</h2>
          <p>
            我们可能会不时更新本隐私政策。更新后的政策将在应用中发布，并通过电子邮件通知您（如果更改重大）。
          </p>
          <p className="mt-4 font-semibold">
            建议：请定期查看本隐私政策，以了解我们如何保护您的信息。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. 联系我们</h2>
          <p>如果您对本隐私政策有任何疑问或疑虑，请通过以下方式联系我们：</p>
          <ul className="list-none mt-4">
            <li><strong>电子邮件：</strong> s20316.wei@stu.scie.com.cn</li>
            <li><strong>应用内反馈：</strong> "个人资料" → "帮助与反馈"</li>
          </ul>
          <p className="mt-4">
            我们会在 <strong>7 个工作日内</strong>回复您的咨询。
          </p>
        </section>
      </div>
    </div>
  );
}
