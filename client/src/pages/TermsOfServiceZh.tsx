import { Link } from "wouter";

export default function TermsOfServiceZh() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">服务条款</h1>
        <Link href="/terms-of-service" className="text-blue-600 hover:underline">
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
          <h2 className="text-2xl font-semibold mb-4">1. 接受条款</h2>
          <p>
            通过访问或使用 ProfMatch，您同意受本服务条款的约束。如果您不同意，请勿使用本服务。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 服务描述</h2>
          
          <h3 className="text-xl font-semibold mb-3">2.1 ProfMatch 提供的服务</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>教授匹配：</strong>根据您的研究兴趣推荐相关教授</li>
            <li><strong>匹配历史：</strong>保存您喜欢的教授列表</li>
            <li><strong>AI 求职信生成：</strong>使用 AI 生成定制化的求职信草稿</li>
            <li><strong>个人资料管理：</strong>创建和编辑您的学术背景资料</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">2.2 服务限制</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>ProfMatch 是一个<strong>信息平台</strong>，不保证您能成功联系到教授或获得研究机会</li>
            <li>我们不对教授的回复率、录取结果或任何学术成果负责</li>
            <li>教授信息可能存在延迟或不准确，我们会尽力保持数据更新</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 用户资格</h2>
          
          <h3 className="text-xl font-semibold mb-3">3.1 年龄要求</h3>
          <p>您必须年满 <strong>18 岁</strong>才能使用 ProfMatch。</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">3.2 账号注册</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>您必须提供准确、完整和最新的注册信息</li>
            <li>您有责任保护您的账号密码和安全</li>
            <li>您不得与他人共享账号或转让账号</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">3.3 禁止行为</h3>
          <p>您同意<strong>不会</strong>：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>使用虚假身份或冒充他人</li>
            <li>骚扰、威胁或侵犯教授或其他用户</li>
            <li>发送垃圾邮件或未经请求的商业信息</li>
            <li>使用自动化工具（如爬虫、机器人）访问服务</li>
            <li>尝试破解、反向工程或干扰应用功能</li>
            <li>上传恶意软件、病毒或有害代码</li>
            <li>侵犯他人的知识产权或隐私权</li>
          </ul>
          <p className="font-semibold">违规后果：违反上述规定可能导致账号被暂停或永久封禁。</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. AI 生成内容免责</h2>
          
          <h3 className="text-xl font-semibold mb-3">4.1 内容性质</h3>
          <p>ProfMatch 使用 AI 技术生成求职信草稿。这些内容：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>仅供<strong>参考和启发</strong>，不保证准确性或适用性</li>
            <li>可能包含错误、不准确或不恰当的信息</li>
            <li>需要用户<strong>自行审核、修改和完善</strong></li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.2 用户责任</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>您有责任审核和编辑 AI 生成的内容</li>
            <li>您对提交给教授或学校的最终内容负全部责任</li>
            <li>ProfMatch 不对使用 AI 内容导致的任何后果负责（如申请被拒、学术不诚信指控等）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 学术诚信</h3>
          <p>我们鼓励您：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>将 AI 生成的内容作为<strong>起点</strong>，而非最终版本</li>
            <li>添加您的个人经历、见解和独特视角</li>
            <li>遵守目标学校和教授的学术诚信政策</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. 知识产权</h2>
          
          <h3 className="text-xl font-semibold mb-3">5.1 ProfMatch 的知识产权</h3>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>应用代码、设计、商标、Logo：</strong>归 ProfMatch 所有</li>
            <li><strong>教授数据：</strong>来自公开来源，不主张所有权</li>
            <li><strong>用户生成内容：</strong>您保留所有权，但授予我们使用许可（见下文）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.2 用户内容许可</h3>
          <p>通过上传或提交内容（如个人资料、活动记录），您授予 ProfMatch：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>非独占、全球、免版税、可转让</strong>的许可</li>
            <li>用于提供、改进和推广服务</li>
            <li>您可以随时删除内容，许可将终止</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">5.3 反馈和建议</h3>
          <p>如果您向我们提供反馈或建议，我们可以自由使用，无需向您支付任何费用。</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. 免责声明</h2>
          
          <h3 className="text-xl font-semibold mb-3">6.1 服务"按原样"提供</h3>
          <p>ProfMatch 按"按原样"和"可用"基础提供，不提供任何明示或暗示的保证，包括但不限于：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>适销性：</strong>服务适合特定用途</li>
            <li><strong>准确性：</strong>教授信息和匹配结果的准确性</li>
            <li><strong>可用性：</strong>服务不中断或无错误</li>
            <li><strong>安全性：</strong>数据完全安全或不受侵犯</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">6.2 第三方内容</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>应用可能包含指向第三方网站的链接（如大学官网）</li>
            <li>我们不对第三方内容的准确性、合法性或安全性负责</li>
            <li>访问第三方网站的风险由您自行承担</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. 责任限制</h2>
          
          <h3 className="text-xl font-semibold mb-3">7.1 间接损失</h3>
          <p>在法律允许的最大范围内，ProfMatch 不对以下损失负责：</p>
          <ul className="list-disc pl-6 mb-4">
            <li><strong>间接损失：</strong>利润损失、商誉损失、数据丢失</li>
            <li><strong>特殊损失：</strong>惩罚性赔偿、附带损失</li>
            <li><strong>后果性损失：</strong>因使用或无法使用服务导致的任何后果</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">7.2 责任上限</h3>
          <p>如果我们被认定负有责任，我们的总责任不超过：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>您在过去 12 个月内支付给 ProfMatch 的费用（如有）</li>
            <li>或 <strong>$100 美元</strong>（如服务免费）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">7.3 例外情况</h3>
          <p>上述责任限制不适用于：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>因我们的故意不当行为或重大过失导致的损失</li>
            <li>法律不允许免除或限制的责任</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. 服务终止</h2>
          
          <h3 className="text-xl font-semibold mb-3">8.1 用户终止</h3>
          <p>您可以随时通过删除账号终止使用 ProfMatch。</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">8.2 ProfMatch 终止</h3>
          <p>我们保留在以下情况下暂停或终止您的账号的权利：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>违反本服务条款</li>
            <li>从事欺诈、滥用或非法活动</li>
            <li>长期不活跃（超过 2 年）</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">8.3 终止后果</h3>
          <p>账号终止后：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>您将无法访问您的数据和匹配历史</li>
            <li>我们可能会删除您的个人信息（根据隐私政策）</li>
            <li>某些条款（如知识产权、免责声明）将继续有效</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. 争议解决</h2>
          
          <h3 className="text-xl font-semibold mb-3">9.1 适用法律</h3>
          <p>本服务条款受<strong>美国加利福尼亚州</strong>法律管辖。</p>

          <h3 className="text-xl font-semibold mb-3 mt-4">9.2 争议解决方式</h3>
          <p>如果发生争议，我们鼓励您首先通过以下方式联系我们：</p>
          <ul className="list-disc pl-6 mb-4">
            <li>发送邮件至 s20316.wei@stu.scie.com.cn</li>
            <li>在应用内提交反馈</li>
          </ul>
          <p className="mt-4">
            如果无法通过协商解决，争议将提交至<strong>具有管辖权的法院</strong>或通过<strong>仲裁</strong>解决。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. 条款更新</h2>
          <p>
            我们可能会不时更新本服务条款。更新后的条款将在应用中发布，并通过电子邮件通知您（如果更改重大）。
          </p>
          <p className="mt-4 font-semibold">
            继续使用服务即表示您接受更新后的条款。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. 联系我们</h2>
          <p>如果您对本服务条款有任何疑问，请通过以下方式联系我们：</p>
          <ul className="list-none mt-4">
            <li><strong>电子邮件：</strong> s20316.wei@stu.scie.com.cn</li>
            <li><strong>应用内反馈：</strong> "个人资料" → "帮助与反馈"</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
