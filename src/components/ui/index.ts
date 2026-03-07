// src/components/ui/index.ts

// 导出UI组件
export { default as Button, type ButtonVariant, type ButtonSize } from './Button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export { default as Input, type InputVariant, type InputSize, type InputShape } from './Input';
export { default as LoadingSpinner, type SpinnerSize, type SpinnerVariant } from './LoadingSpinner';
export { default as Badge, type BadgeVariant, type BadgeSize, type BadgeShape } from './Badge';
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, type AvatarSize, type AvatarShape, type AvatarStatus } from './Avatar';
export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from './Table';
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './Dialog';
export { default as Textarea } from './Textarea';
export { default as Label } from './Label';
export { default as Separator } from './Separator';
export { default as Checkbox } from './Checkbox';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './Select';
export { Switch } from './Switch';
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './Tooltip';
export { Progress } from './Progress';
export { ScrollArea } from './ScrollArea';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from './DropdownMenu';

// 导出工具函数
export * from './utils';
