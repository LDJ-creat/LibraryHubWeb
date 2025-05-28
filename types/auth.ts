// 定义用户基本信息类型
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: string; // 与后端响应一致，单个角色字符串
}

// 定义登录请求体类型
export interface LoginRequestBody {
  username: string;
  password: string;
}

// 定义注册请求体类型
export interface SignUpRequestBody {
  username: string;
  email: string;
  emailVerificationCode: string;
  password: string;
}