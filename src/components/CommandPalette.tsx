import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { useTheme } from '@/hooks/useTheme';

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  shortcut?: string[];
  action: () => void;
  category: string;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // 注册命令
  const commands: CommandItem[] = [
    // 导航
    { id: 'nav-home', title: '首页', description: '返回首页', icon: 'fas fa-home', category: '导航', action: () => navigate('/') },
    { id: 'nav-explore', title: '探索', description: '浏览作品', icon: 'fas fa-compass', category: '导航', action: () => navigate('/explore') },
    { id: 'nav-create', title: '创作', description: '开始新的创作', icon: 'fas fa-plus', category: '导航', action: () => navigate('/create') },
    { id: 'nav-dashboard', title: '个人中心', description: '查看个人数据', icon: 'fas fa-chart-line', category: '导航', action: () => navigate('/dashboard') },
    
    // 系统
    { id: 'sys-theme', title: '切换主题', description: isDark ? '切换到亮色模式' : '切换到暗色模式', icon: 'fas fa-adjust', category: '系统', action: () => toggleTheme() },
    { id: 'sys-help', title: '帮助中心', description: '查看使用文档', icon: 'fas fa-question-circle', category: '系统', action: () => navigate('/help') },
    
    // 工具
    { id: 'tool-search', title: '搜索', description: '全局搜索', icon: 'fas fa-search', category: '工具', action: () => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus() },
  ];

  // 监听快捷键
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, []);

  // 过滤命令
  const filteredCommands = query === ''
    ? commands
    : commands.filter((command) =>
        command.title.toLowerCase().includes(query.toLowerCase()) ||
        command.description?.toLowerCase().includes(query.toLowerCase())
      );

  // 分组
  const groups = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all dark:bg-gray-800 dark:divide-gray-700 dark:ring-white/10">
              <div className="relative">
                <i className="fas fa-search pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm dark:text-white"
                  placeholder="搜索命令... (Ctrl/Cmd + K)"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoFocus
                />
              </div>

              {filteredCommands.length > 0 && (
                <div className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                  {Object.entries(groups).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <div className="mb-2 px-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {category}
                      </div>
                      <ul className="space-y-1">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="group flex cursor-pointer select-none items-center rounded-lg px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => {
                              item.action();
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-gray-100 group-hover:bg-white dark:bg-gray-700 dark:group-hover:bg-gray-600">
                              <i className={`${item.icon} text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200`} />
                            </div>
                            <div className="ml-3 flex-auto">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {query !== '' && filteredCommands.length === 0 && (
                <div className="px-6 py-14 text-center text-sm sm:px-14">
                  <i className="fas fa-exclamation-circle mx-auto h-6 w-6 text-gray-400" />
                  <p className="mt-4 font-semibold text-gray-900 dark:text-white">未找到相关命令</p>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    请尝试其他关键词
                  </p>
                </div>
              )}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
