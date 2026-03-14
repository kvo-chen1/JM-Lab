// 数据验证服务
import { z } from 'zod';

// 作品验证模式
export const workSchema = z.object({
  id: z.number().optional(),
  title: z.string()
    .min(1, { message: '作品标题不能为空' })
    .max(255, { message: '作品标题最多255个字符' }),
  thumbnail: z.string()
    .min(1, { message: '作品缩略图不能为空' }),
  category: z.string()
    .min(1, { message: '作品分类不能为空' }),
  tags: z.array(z.string())
    .min(1, { message: '作品标签至少需要1个' }),
  description: z.string().optional(),
  views: z.number().optional(),
  likes: z.number().optional(),
  comments: z.number().optional(),
  creator: z.string().optional(),
  creatorAvatar: z.string().optional(),
  featured: z.boolean().optional(),
  user_id: z.union([z.string(), z.number()]).optional(),
  videoUrl: z.string().optional(),
  duration: z.string().optional(),
  imageTag: z.string().optional(),
  modelUrl: z.string().optional(),
});

// 用户验证模式
export const userSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  username: z.string()
    .min(2, { message: '用户名至少需要2个字符' })
    .max(20, { message: '用户名最多20个字符' }),
  email: z.string()
    .email({ message: '请输入有效的邮箱地址' }),
  password: z.string()
    .min(8, { message: '密码至少需要8个字符' })
    .regex(/[a-zA-Z]/, { message: '密码需要包含至少一个字母' })
    .regex(/[0-9]/, { message: '密码需要包含至少一个数字' }),
  phone: z.string().optional(),
  avatar_url: z.string().optional(),
  interests: z.array(z.string()).optional(),
  age: z.number().optional(),
  tags: z.array(z.string()).optional(),
  membershipLevel: z.enum(['free', 'premium', 'vip']).optional(),
  membershipStatus: z.enum(['active', 'expired', 'pending']).optional(),
  membershipStart: z.string().optional(),
  membershipEnd: z.string().optional(),
});

// 评论验证模式
export const commentSchema = z.object({
  id: z.string().optional(),
  content: z.string()
    .min(1, { message: '评论内容不能为空' })
    .max(1000, { message: '评论内容最多1000个字符' }),
  postId: z.union([z.string(), z.number()]),
  parentId: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
});

// 分类验证模式
export const categorySchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string()
    .min(1, { message: '分类名称不能为空' })
    .max(100, { message: '分类名称最多100个字符' }),
  description: z.string().optional(),
  icon: z.string().optional(),
  parent_id: z.union([z.string(), z.number()]).optional(),
  is_active: z.boolean().optional(),
});

// 标签验证模式
export const tagSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.string()
    .min(1, { message: '标签名称不能为空' })
    .max(50, { message: '标签名称最多50个字符' }),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

// 通用验证结果类型
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

// 统一验证函数
export function validate<T>(schema: z.ZodSchema<T>, data: any): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach(issue => {
        errors[issue.path[0]] = issue.message;
      });
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: {
        general: '验证失败',
      },
    };
  }
}

// 部分验证函数
export function validatePartial<T>(schema: any, data: any): ValidationResult<Partial<T>> {
  try {
    // 检查schema是否有partial方法
    if (typeof schema.partial !== 'function') {
      return {
        success: false,
        errors: {
          general: '无效的schema类型，缺少partial方法',
        },
      };
    }
    
    const partialSchema = schema.partial();
    const validatedData = partialSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach(issue => {
        errors[issue.path[0]] = issue.message;
      });
      return {
        success: false,
        errors,
      };
    }
    return {
      success: false,
      errors: {
        general: '验证失败',
      },
    };
  }
}

// 验证服务类
export class ValidationService {
  /**
   * 验证作品数据
   */
  validateWork(data: any): ValidationResult<any> {
    return validate(workSchema, data);
  }

  /**
   * 部分验证作品数据
   */
  validateWorkPartial(data: any): ValidationResult<any> {
    return validatePartial(workSchema, data);
  }

  /**
   * 验证用户数据
   */
  validateUser(data: any): ValidationResult<any> {
    return validate(userSchema, data);
  }

  /**
   * 部分验证用户数据
   */
  validateUserPartial(data: any): ValidationResult<any> {
    return validatePartial(userSchema, data);
  }

  /**
   * 验证评论数据
   */
  validateComment(data: any): ValidationResult<any> {
    return validate(commentSchema, data);
  }

  /**
   * 验证分类数据
   */
  validateCategory(data: any): ValidationResult<any> {
    return validate(categorySchema, data);
  }

  /**
   * 验证标签数据
   */
  validateTag(data: any): ValidationResult<any> {
    return validate(tagSchema, data);
  }
}

// 导出单例实例
export const validationService = new ValidationService();
