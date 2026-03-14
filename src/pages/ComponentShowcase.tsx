import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Avatar,
  Skeleton,
  SkeletonList,
  SkeletonCard,
  EmptyState,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  Switch,
  Select,
  Form,
  FormField,
  Radio,
  RadioGroup,
  Checkbox,
  toast
} from '@/components/DesignSystem';

export default function ComponentShowcase() {
  const [switchValue, setSwitchValue] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [radioValue, setRadioValue] = useState('option1');
  const [progressValue, setProgressValue] = useState(45);
  const [tabValue, setTabValue] = useState('basic');

  const selectOptions = [
    { value: 'tianjin', label: '天津' },
    { value: 'beijing', label: '北京' },
    { value: 'shanghai', label: '上海' },
    { value: 'guangzhou', label: '广州' },
    { value: 'shenzhen', label: '深圳' }
  ];

  const handleFormSubmit = (values: any) => {
    toast.success('表单提交成功！');
    console.log('表单数据:', values);
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        toast.success('操作成功！这是一条成功通知');
        break;
      case 'error':
        toast.error('操作失败！这是一条错误通知');
        break;
      case 'warning':
        toast.warning('请注意！这是一条警告通知');
        break;
      case 'info':
        toast.info('温馨提示！这是一条信息通知');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            组件展示页面
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            这里展示了刚刚优化的所有UI/UX组件
          </p>
        </motion.div>

        <Tabs value={tabValue} onValueChange={setTabValue}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基础组件</TabsTrigger>
            <TabsTrigger value="form">表单组件</TabsTrigger>
            <TabsTrigger value="feedback">反馈组件</TabsTrigger>
            <TabsTrigger value="layout">布局组件</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>按钮组件 (Button)</CardTitle>
                <CardDescription>
                  支持多种样式、尺寸和状态的按钮，带有Framer Motion动画
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button>默认按钮</Button>
                  <Button variant="secondary">次要按钮</Button>
                  <Button variant="outline">边框按钮</Button>
                  <Button variant="ghost">幽灵按钮</Button>
                  <Button variant="destructive">危险按钮</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">小按钮</Button>
                  <Button size="default">默认按钮</Button>
                  <Button size="lg">大按钮</Button>
                  <Button isLoading>加载中...</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>开关组件 (Switch)</CardTitle>
                  <CardDescription>开关选择器，带动画效果</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Switch
                    checked={switchValue}
                    onCheckedChange={setSwitchValue}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {switchValue ? '已开启' : '已关闭'}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>进度条组件 (Progress)</CardTitle>
                  <CardDescription>支持多种颜色变体的进度条</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressValue} showLabel />
                  <Progress value={75} variant="success" />
                  <Progress value={50} variant="warning" />
                  <Progress value={25} variant="error" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>
                      -10%
                    </Button>
                    <Button size="sm" onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>
                      +10%
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>选择器组件 (Select)</CardTitle>
                <CardDescription>支持搜索和多选的选择器</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">单选模式</label>
                    <Select
                      options={selectOptions}
                      value={selectValue}
                      onValueChange={setSelectValue}
                      placeholder="选择城市"
                      searchable
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">多选模式</label>
                    <Select
                      options={selectOptions}
                      placeholder="选择多个城市"
                      searchable
                      multiple
                      maxSelected={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>徽章组件 (Badge)</CardTitle>
                <CardDescription>用于显示状态和标签的徽章</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Badge>默认</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="destructive">危险</Badge>
                <Badge variant="outline">边框</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>头像组件 (Avatar)</CardTitle>
                <CardDescription>用户头像展示</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar size="sm" fallback="张" />
                <Avatar size="default" fallback="李" />
                <Avatar size="lg" fallback="王" />
                <Avatar size="xl" fallback="赵" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>表单组件 (Form)</CardTitle>
                <CardDescription>统一的表单容器和字段组件</CardDescription>
              </CardHeader>
              <CardContent>
                <Form onSubmit={handleFormSubmit} className="space-y-6">
                  <FormField
                    name="username"
                    label="用户名"
                    description="请输入您的用户名"
                    required
                  >
                    <Input placeholder="请输入用户名" />
                  </FormField>

                  <FormField
                    name="email"
                    label="邮箱"
                    description="我们不会分享您的邮箱"
                  >
                    <Input type="email" placeholder="example@email.com" />
                  </FormField>

                  <FormField
                    name="gender"
                    label="性别"
                  >
                    <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                      <Radio value="option1" label="男" />
                      <Radio value="option2" label="女" />
                      <Radio value="option3" label="其他" />
                    </RadioGroup>
                  </FormField>

                  <FormField
                    name="interests"
                    label="兴趣爱好"
                  >
                    <div className="space-y-2">
                      <Checkbox label="绘画" />
                      <Checkbox label="音乐" />
                      <Checkbox label="摄影" />
                      <Checkbox label="编程" />
                    </div>
                  </FormField>

                  <CardFooter className="px-0">
                    <Button type="submit">提交表单</Button>
                  </CardFooter>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>通知组件 (Toast)</CardTitle>
                <CardDescription>点击按钮查看不同类型的通知</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => showToast('success')}>
                    成功通知
                  </Button>
                  <Button variant="destructive" onClick={() => showToast('error')}>
                    错误通知
                  </Button>
                  <Button variant="secondary" onClick={() => showToast('warning')}>
                    警告通知
                  </Button>
                  <Button variant="outline" onClick={() => showToast('info')}>
                    信息通知
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>空状态组件 (EmptyState)</CardTitle>
                <CardDescription>用于显示无数据的状态</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                  title="暂无数据"
                  description="这里还没有任何内容，赶紧开始创建吧！"
                  action={
                    <Button>开始创建</Button>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>骨架屏组件 (Skeleton)</CardTitle>
                <CardDescription>用于加载状态的占位组件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">文本骨架</h4>
                  <div className="space-y-2">
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">卡片骨架</h4>
                  <SkeletonCard />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">列表骨架</h4>
                  <SkeletonList count={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>下拉菜单组件 (Dropdown)</CardTitle>
                <CardDescription>点击按钮打开下拉菜单</CardDescription>
              </CardHeader>
              <CardContent>
                <Dropdown
                  trigger={
                    <Button variant="outline">
                      打开菜单
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>
                  }
                >
                  <DropdownLabel>菜单分组</DropdownLabel>
                  <DropdownItem>选项 1</DropdownItem>
                  <DropdownItem>选项 2</DropdownItem>
                  <DropdownSeparator />
                  <DropdownLabel>更多操作</DropdownLabel>
                  <DropdownItem>设置</DropdownItem>
                  <DropdownItem>帮助</DropdownItem>
                  <DropdownItem disabled>禁用项</DropdownItem>
                </Dropdown>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>标签页组件 (Tabs)</CardTitle>
                <CardDescription>标签页导航组件</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="tab1">
                  <TabsList>
                    <TabsTrigger value="tab1">标签 1</TabsTrigger>
                    <TabsTrigger value="tab2">标签 2</TabsTrigger>
                    <TabsTrigger value="tab3">标签 3</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tab1" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mt-2">
                    这是标签 1 的内容
                  </TabsContent>
                  <TabsContent value="tab2" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mt-2">
                    这是标签 2 的内容
                  </TabsContent>
                  <TabsContent value="tab3" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md mt-2">
                    这是标签 3 的内容
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>卡片组件 (Card)</CardTitle>
                <CardDescription>完整的卡片组件演示</CardDescription>
              </CardHeader>
              <CardContent>
                <Card className="bordered">
                  <CardHeader bordered>
                    <CardTitle>卡片标题</CardTitle>
                    <CardDescription>这是卡片的描述文字</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400">
                      这是卡片的主要内容区域，您可以在这里放置任何内容。
                    </p>
                  </CardContent>
                  <CardFooter bordered align="between">
                    <Badge>示例</Badge>
                    <Button size="sm">操作</Button>
                  </CardFooter>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-8"
        >
          <Button asChild variant="outline">
            <Link to="/">
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回首页
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
