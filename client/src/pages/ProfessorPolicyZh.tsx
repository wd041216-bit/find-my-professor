import { Link } from "wouter";

export default function ProfessorPolicyZh() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">教授政策</h1>
        <Link href="/professor-policy" className="text-blue-600 hover:underline">
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
          <h2 className="text-2xl font-semibold mb-4">1. 我们对教授的承诺</h2>
          <p>
            ProfMatch 致力于创建一个<strong>尊重教授、保护隐私、促进学术交流</strong>的平台。我们理解教授的时间宝贵，并承诺：
          </p>
          <ul className="list-disc pl-6 mb-4 mt-4">
            <li>✅ 仅使用公开的学术信息</li>
            <li>✅ 不收集或显示私人联系方式</li>
            <li>✅ 提供快速的信息移除机制</li>
            <li>✅ 防止学生滥用平台骚扰教授</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 教授信息来源</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 数据来源</h3>
          <p>我们从以下公开来源收集教授信息：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>大学官方网站：</strong>教师名录、院系页面、个人主页</li>
            <li><strong>学术数据库：</strong>Google Scholar、ResearchGate、ORCID</li>
            <li><strong>学术出版物：</strong>会议论文、期刊文章、研究报告</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 收集的信息</h3>
          <p>我们仅收集以下公开信息：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>✅ 姓名</li>
            <li>✅ 所在大学和院系</li>
            <li>✅ 研究方向/领域</li>
            <li>✅ 学术职称（教授、副教授、助理教授等）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.3 不收集的信息</h3>
          <p>我们<strong>不会</strong>收集或显示：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>❌ 教授照片或肖像</li>
            <li>❌ 个人联系方式（邮箱、电话、办公室地址）</li>
            <li>❌ 家庭住址或私人信息</li>
            <li>❌ 社交媒体账号（除非是学术用途的公开账号）</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 教授退出机制</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 移除请求</h3>
          <p>任何教授都可以随时请求移除其在 ProfMatch 上的信息。</p>
          
          <h4 className="text-lg font-semibold mb-2 mt-4">如何提交请求：</h4>
          <ol className="list-decimal pl-6 mb-4">
            <li>访问 ProfMatch 应用或网站</li>
            <li>进入"Contact Us"页面</li>
            <li>选择"Professor Removal Request"</li>
            <li>填写以下信息：
              <ul className="list-circle pl-6 mt-2">
                <li>您的姓名</li>
                <li>所在大学</li>
                <li>院系/研究方向</li>
                <li>大学邮箱（用于验证身份）</li>
                <li>移除原因（可选）</li>
              </ul>
            </li>
          </ol>
          <p className="font-semibold">或直接发送邮件至：optout@profmatch.com</p>

          <h3 className="text-xl font-semibold mb-3 mt-6">3.2 处理时间</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>我们承诺在收到请求后 <strong>7 个工作日内</strong>处理</li>
            <li>处理完成后，您的信息将从应用中完全移除</li>
            <li>我们会向您发送确认邮件</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 验证流程</h3>
          <p>为防止恶意移除请求，我们会验证您的身份：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>首选方式：</strong>使用大学官方邮箱（如 @university.edu）</li>
            <li><strong>备选方式：</strong>提供大学教师页面链接或其他身份证明</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. 信息准确性</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 数据更新</h3>
          <p>我们努力保持教授信息的准确性：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>定期从官方来源更新数据</li>
            <li>用户可以报告不准确或过时的信息</li>
            <li>我们会尽快验证并更新</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 报告错误</h3>
          <p>如果您发现教授信息有误，请通过以下方式报告：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>在应用中点击"Report Inaccuracy"</li>
            <li>发送邮件至 s20316.wei@stu.scie.com.cn</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 防止滥用</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 用户行为规范</h3>
          <p>我们禁止学生用户：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>骚扰或威胁教授</li>
            <li>发送垃圾邮件或未经请求的信息</li>
            <li>冒充教授或其他用户</li>
            <li>使用自动化工具批量联系教授</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.2 举报机制</h3>
          <p>教授可以举报滥用行为：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>发送邮件至 abuse@profmatch.com</li>
            <li>提供滥用行为的详细信息</li>
            <li>我们会在 <strong>48 小时内</strong>调查并采取行动</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.3 处罚措施</h3>
          <p>对于滥用行为，我们将采取以下措施：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>首次违规：</strong>警告并暂停账号 7 天</li>
            <li><strong>再次违规：</strong>暂停账号 30 天</li>
            <li><strong>严重或重复违规：</strong>永久封禁账号</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. 教授的权利</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 访问权</h3>
          <p>教授有权查看我们存储的关于您的信息。</p>
          <p className="font-semibold">如何行使：发送邮件至 optout@profmatch.com</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.2 更正权</h3>
          <p>教授有权要求更正不准确的信息。</p>
          <p className="font-semibold">如何行使：发送邮件至 s20316.wei@stu.scie.com.cn，并提供正确的信息</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.3 删除权</h3>
          <p>教授有权要求删除您的所有信息（见"教授退出机制"）。</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">6.4 反对权</h3>
          <p>教授有权反对我们处理您的信息。</p>
          <p className="font-semibold">如何行使：发送邮件至 optout@profmatch.com</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 法律合规</h2>
          
          <h3 className="text-xl font-semibold mb-3">7.1 合规承诺</h3>
          <p>ProfMatch 遵守以下法律法规：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>GDPR（欧盟）：</strong>通用数据保护条例</li>
            <li><strong>CCPA（加州）：</strong>加州消费者隐私法案</li>
            <li><strong>FERPA（美国）：</strong>家庭教育权利和隐私法案</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">7.2 公平使用原则</h3>
          <p>我们的教授信息使用符合"公平使用"原则：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>仅使用公开可获取的信息</li>
            <li>用于教育和学术交流目的</li>
            <li>不用于商业营销或盈利</li>
            <li>尊重教授的隐私权和知识产权</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. 政策更新</h2>
          <p>
            我们可能会不时更新本教授政策。更新后的政策将在应用中发布，并通过电子邮件通知受影响的教授（如果可能）。
          </p>
          <p className="mt-4 font-semibold">
            建议：请定期查看本政策，以了解我们如何处理教授信息。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. 联系我们</h2>
          <p>如果您对本教授政策有任何疑问或疑虑，请通过以下方式联系我们：</p>
          <ul className="list-none mt-4">
            <li><strong>一般咨询：</strong> s20316.wei@stu.scie.com.cn</li>
            <li><strong>信息移除：</strong> optout@profmatch.com</li>
            <li><strong>滥用举报：</strong> abuse@profmatch.com</li>
          </ul>
          <p className="mt-4">
            我们承诺在 <strong>7 个工作日内</strong>回复教授的所有咨询。
          </p>
        </section>
      </div>
    </div>
  );
}
