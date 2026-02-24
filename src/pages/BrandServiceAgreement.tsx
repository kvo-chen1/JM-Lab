import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Clock,
  ChevronLeft,
  ScrollText,
  Shield,
  Users,
  Building2,
  Lock,
  AlertCircle,
  Scale,
  BookOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BrandServiceAgreementProps {
  isDark?: boolean;
}

const BrandServiceAgreement: React.FC<BrandServiceAgreementProps> = ({ isDark = false }) => {
  const updateDate = '2025年2月24日';
  const effectiveDate = '2025年3月1日';

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'preface', title: '首部及导言', icon: BookOpen },
    { id: 'general', title: '一、总则', icon: Scale },
    { id: 'audit', title: '二、认证审核流程', icon: Shield },
    { id: 'rules', title: '三、本服务守则', icon: ScrollText },
    { id: 'confidentiality', title: '四、保密条款', icon: Lock },
    { id: 'privacy', title: '五、隐私政策', icon: Users },
    { id: 'modification', title: '六、协议变更、中止及终止', icon: AlertCircle },
    { id: 'others', title: '七、其他', icon: FileText },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* 顶部导航 */}
      <div className={`sticky top-0 z-50 border-b ${isDark ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-gray-200'} backdrop-blur-sm`}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link 
            to="/business-cooperation" 
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            返回入驻申请
          </Link>
          <div className={`h-4 w-px ${isDark ? 'bg-slate-700' : 'bg-gray-300'}`} />
          <h1 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            品牌入驻服务协议
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左侧目录 */}
          <div className="hidden lg:block">
            <div className={`sticky top-24 p-4 rounded-2xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
              <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                目录
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                      isDark 
                        ? 'text-gray-400 hover:text-white hover:bg-slate-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <section.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`p-8 rounded-3xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}
            >
              {/* 标题区域 */}
              <div className="text-center mb-10 pb-8 border-b border-gray-200 dark:border-slate-700">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 mb-6">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    津脉智坊
                  </span>
                </div>
                <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  品牌入驻服务协议
                </h1>
                <div className={`flex flex-wrap justify-center gap-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>更新时间：{updateDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>生效时间：{effectiveDate}</span>
                  </div>
                </div>
              </div>

              {/* 协议内容 */}
              <div className={`prose prose-lg max-w-none ${isDark ? 'prose-invert' : ''}`}>
                {/* 首部及导言 */}
                <section id="preface" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    【首部及导言】
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      欢迎您阅读《津脉智坊品牌入驻服务协议》并使用津脉智坊品牌入驻服务！
                    </p>
                    <p>
                      本协议是基于《津脉智坊用户使用协议》《津脉智坊隐私政策》《社区公约》《帮助中心》以及津脉智坊平台的相关协议规范（统称为"津脉智坊服务条款"）制定；同时，津脉智坊不时发布的关于本服务的相关协议、规则、声明、公告、政策、活动规则等也是本协议的一部分，您在使用本服务的同时应遵守本协议、津脉智坊服务条款及前述相关协议、规则、声明、公告、政策、活动规则、问答等所有条款。
                    </p>
                    <p>
                      您申请使用本服务应当阅读并充分理解遵守本协议以及津脉智坊服务条款，本协议中与您的权益（可能）存在重大关系的条款（包括免除津脉智坊责任的条款、限制您权利的条款、约定的争议解决方式及司法管辖条款等）已采用字体加粗的方式来特别提醒您，请您留意重点查阅。若您不同意本协议中所述任何条款或其后对协议条款的修改，请立即申请停止使用本服务。您使用本服务的行为将被视为已经仔细阅读、充分理解并毫无保留地接受本协议所有条款。
                    </p>
                  </div>
                </section>

                {/* 一、总则 */}
                <section id="general" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    一、总则
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      津脉智坊品牌入驻服务（以下简称"本服务"）是津脉智坊在津脉智坊网页及客户端中设立的网络增值服务，您可向津脉智坊申请对您的津脉智坊账号（以下简称"账号"）进行认证审核，通过认证审核后您有权以官方认证信息所公示的身份对外运营，并通过官方认证标识和/或身份展示区别于其他未认证的津脉智坊用户。
                    </p>
                  </div>
                </section>

                {/* 二、认证审核流程 */}
                <section id="audit" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    二、认证审核流程
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      1. 本服务仅向津脉智坊用户提供，如您还未注册成为津脉智坊用户，请先根据本协议及津脉智坊服务条款提示的规则、流程注册成为津脉智坊用户。
                    </p>
                    <p>
                      2. 您应当通过津脉智坊官方渠道申请本服务，并根据申请页面提示的规则、流程提供主体资格证明文件、联系方式等申请资料以完成官方认证，您承诺您提交的申请资料均真实准确、合法有效。津脉智坊有权对您提交的材料进行认证审核，如您提交的申请资料的真实性、准确性、合法性、有效性存在瑕疵，津脉智坊有权拒绝为您提供部分或全部本服务。如果您的申请资料不完整或发生变化，请立即重新提供或补充提供。
                    </p>
                    <p>
                      3. 您理解并同意，津脉智坊向您提供不同类型的官方认证服务，根据官方认证类型的不同，津脉智坊可能向您及您的账号要求不同的认证条件、申请资料等，不同官方认证类型的具体内容请以申请页面的信息为准。
                    </p>
                    <p>
                      4. <strong>津脉智坊有权根据认证审核结果独立判断是否满足本服务的认证条件。</strong>认证审核包括如下环节：
                    </p>
                    <div className="pl-6 space-y-2">
                      <p>
                        <strong>（1）用户信息审核。</strong>津脉智坊有权要求您提交主体资格证明文件（包括但不限于身份证、护照、工商营业执照、事业单位法人证书等）、权利证明书（包括但不限于授权委托书、商标注册证等）等相关申请资料，并审查核实相关申请资料是否真实准确、合法有效。如您提供的服务或内容需要取得相关法律法规规定的许可或备案，您应当主动说明并提交相关许可或备案。
                      </p>
                      <p>
                        <strong>（2）品牌信息审核。</strong>津脉智坊有权审查核实您申请的品牌名称及认证信息是否符合官方认证要求，并有权向您提出修改品牌信息的建议。如您在收到津脉智坊的建议后拒绝修改品牌信息，津脉智坊有权自行修改您的品牌信息或拒绝为您提供本服务。
                      </p>
                      <p>
                        <strong>（3）认证资质审核。</strong>津脉智坊有权要求您根据不同的官方认证类型提交不同的申请资料（包括但不限于运营授权、行业证照、执业/职业资质等），并审查核实您及您的账号是否符合该官方认证类型的认证条件。
                      </p>
                    </div>
                    <p>
                      5. 通过认证审核的所有环节视为认证审核成功，未通过认证审核的任一环节视为认证审核失败。
                    </p>
                    <p>
                      6. 如您成功通过认证审核，津脉智坊将根据您的申请资料为您生成官方认证信息并予以展示，官方认证信息包括官方认证标识以及根据您提交的申请资料信息生成的认证品牌名称、认证信息以及称号后缀，和/或执业/职业资质。津脉智坊有权根据不同类型的官方认证服务为您生成不同组合与类型的官方认证展示信息，并且津脉智坊有权根据经营策略的调整，随时更改官方认证展示信息的内容及格式。
                    </p>
                    <p>
                      7. 您理解并同意，津脉智坊的认证审核仅限于依据本协议约定对申请资料进行形式审查，津脉智坊的认证审核不视为津脉智坊对通过认证审核的用户及其账号（以下简称"官方认证账号"）的真实性、合法性负责，津脉智坊不对此承担任何刑事、民事和行政责任。
                    </p>
                  </div>
                </section>

                {/* 三、本服务守则 */}
                <section id="rules" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    三、本服务守则
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      1. 您承诺您未与任何第三方订立与本协议相冲突的协议或类似的任何安排或承诺（包括但不限于书面记录或口头承诺等）。
                    </p>
                    <p>
                      2. 您承诺您具有申请本服务所需的所有合法资质以及完全有效且不可撤销的授权。
                    </p>
                    <p>
                      3. 官方认证账号应符合最新的认证条件，津脉智坊有权对官方认证账号的资质进行定期（每年）评估。
                    </p>
                    <p>
                      4. 您在使用本服务期间应遵守法律法规、本协议、津脉智坊服务条款，不得违反社会公德、公序良俗和/或侵害他人合法权益等。
                    </p>
                    <p>
                      5. 您承诺您提供的品牌信息、企业资质、联系方式等所有申请资料真实、准确、完整、合法有效，并在信息发生变更时及时更新。
                    </p>
                    <p>
                      6. 您理解并同意，津脉智坊有权根据法律法规、监管要求或平台运营需要，对认证审核标准、流程进行调整，并在相关页面进行公布。
                    </p>
                  </div>
                </section>

                {/* 四、保密条款 */}
                <section id="confidentiality" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    四、保密条款
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      1. 除本协议另有约定外，接收方承诺对由披露方提供的保密信息承担无期限的保密义务，未经披露方书面许可，不得用于本协议以外目的或以任何方式透露给第三方。接收方应当采取所有保密制度和措施保护保密信息，且保护水平应不低于接收方为保护自有保密信息所采取制度和措施。
                    </p>
                    <p>
                      2. 保密信息是指与披露方业务有关的且能为披露方带来经济利益，具有实用性的、非公知的所有信息，包括但不限于：技术信息、经营信息和与披露方行政管理有关的信息和文件（含本协议及相关协议内容）、权利归属方式、授权方式、联系方式、工作人员名单及联系方式、合作物料、素材、内容、方案等不为公众所知悉的信息。
                    </p>
                  </div>
                </section>

                {/* 五、隐私政策 */}
                <section id="privacy" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    五、隐私政策
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      您理解并同意，津脉智坊将按照《津脉智坊隐私政策》的约定处理和保护您的个人信息。在申请品牌入驻服务过程中，您可能需要提供企业名称、统一社会信用代码、法定代表人信息、联系人信息、营业执照等敏感信息，我们将严格按照法律法规的要求，采取必要的安全措施保护您的信息安全。
                    </p>
                    <p>
                      我们收集和使用您的个人信息仅限于以下目的：
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>完成品牌入驻身份审核和资质验证</li>
                      <li>为您提供品牌入驻后的相关服务</li>
                      <li>与您联系沟通入驻相关事宜</li>
                      <li>遵守法律法规和监管要求</li>
                    </ul>
                  </div>
                </section>

                {/* 六、协议变更、中止及终止 */}
                <section id="modification" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    六、协议变更、中止及终止
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      1. 津脉智坊有权根据法律法规、国家政策、行业规范以及津脉智坊经营策略的变化调整，单方变更、中止、终止本协议内容，并在相关页面进行公布。
                    </p>
                    <p>
                      2. 前述内容一经在相关的页面上公布即有效代替原来的协议内容，同时津脉智坊将以适当的方式（包括但不限于弹窗、邮件、站内信、系统通知、平台通知、网站公告等）提醒您更新后的内容，以便您及时了解本协议的最新版本。
                    </p>
                    <p>
                      3. 您理解并同意，如存在以下情形，津脉智坊有权中止或终止向您提供本服务及本协议，上述权利的行使无期限限制：
                    </p>
                    <div className="pl-6 space-y-2">
                      <p>（1）您与津脉智坊经友好协商一致，均同意书面中止或终止本协议；</p>
                      <p>（2）您明确表示放弃或津脉智坊有合理理由认为您已放弃官方认证账号的运营；</p>
                      <p>（3）官方认证账号未通过津脉智坊的定期评估，或津脉智坊发现官方认证账号已不符合最新的认证条件；</p>
                      <p>（4）津脉智坊取消或终止某项官方认证类型，或附期限的官方认证类型的有效期已届满；</p>
                      <p>（5）您存在或津脉智坊经独立判断后认为您存在违反法律法规、本协议及津脉智坊服务条款、社会公德、公序良俗和/或侵害他人合法权益等行为的；</p>
                      <p>（6）根据法律法规、监管政策的规定或有权机关的要求；</p>
                      <p>（7）不可抗力（鉴于互联网之特殊性质，不可抗力亦包括黑客攻击、电信部门技术调整导致之重大影响、因政府管制导致的暂时关闭、病毒侵袭等影响互联网正常运行之情形）；</p>
                      <p>（8）为维护账号与系统安全等紧急情况之需要的；</p>
                      <p>（9）其他符合本服务中止或终止条件的情形以及其他可能导致本服务中止或终止的情形。</p>
                    </div>
                    <p>
                      4. 当发生前述中止或终止的情形时，您认可如下处理方式：
                    </p>
                    <div className="pl-6 space-y-2">
                      <p>（1）津脉智坊有权单方中止或终止账号的官方认证资格并取消官方认证信息的展示；</p>
                      <p>（2）如因您违反法律法规、本协议及津脉智坊服务条款、社会公德、公序良俗和/或侵害他人合法权益等行为导致中止或终止的，津脉智坊有权视情况要求您承担津脉智坊因此产生的全部直接或间接支出、损害或责任（包括津脉智坊向第三方支付的损害赔偿、行政处罚等）；</p>
                      <p>（3）除法律法规另有规定或津脉智坊另有说明外，津脉智坊无须向您和/或第三人承担任何责任。</p>
                    </div>
                  </div>
                </section>

                {/* 七、其他 */}
                <section id="others" className="mb-10">
                  <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    七、其他
                  </h2>
                  <div className={`text-base leading-relaxed space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>
                      1. 本协议的成立、生效、履行、解释及纠纷解决，适用中华人民共和国法律。本协议项下因与中华人民共和国现行法律冲突而导致部分无效，不影响其他部分的效力。
                    </p>
                    <p>
                      2. 如就本协议内容或执行发生任何争议，应尽量友好协商解决；协商不成时，则争议各方均一致同意将争议提交被告住所地人民法院诉讼解决。
                    </p>
                    <p>
                      3. 本协议未尽事宜，或与国家、地方有关规定相悖的，按有关规定执行。
                    </p>
                    <p>
                      4. 本协议中的标题仅为方便阅读而设，不影响本协议的解释。
                    </p>
                    <p>
                      5. 如您对本协议有任何疑问或建议，请通过以下方式联系我们：
                    </p>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                      <p className="flex items-center gap-2">
                        <span className="font-medium">客服邮箱：</span>
                        <a href="mailto:support@jinmaizhifang.com" className="text-blue-500 hover:underline">
                          support@jinmaizhifang.com
                        </a>
                      </p>
                      <p className="flex items-center gap-2 mt-2">
                        <span className="font-medium">客服电话：</span>
                        <span>400-XXX-XXXX</span>
                      </p>
                      <p className="flex items-center gap-2 mt-2">
                        <span className="font-medium">工作时间：</span>
                        <span>周一至周五 9:00-18:00</span>
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* 底部信息 */}
              <div className={`mt-10 pt-8 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  <p className="mb-2">历史版本：<a href="#" className="text-blue-500 hover:underline">协议历史版本</a></p>
                  <p>津脉智坊保留对本协议的最终解释权</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandServiceAgreement;
