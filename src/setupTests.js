// 模拟 import.meta.env
globalThis.import = {
  meta: {
    env: {
      DEV: true,
      PROD: false,
      VITE_API_URL: 'http://localhost:3001/api',
    },
  },
};

// 模拟 localStorage
globalThis.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// 模拟 sessionStorage
globalThis.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// 模拟 window 对象的其他属性
globalThis.window = {
  ...globalThis,
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
  },
  scrollTo: jest.fn(),
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
};

// 模拟 document 对象
globalThis.document = {
  ...globalThis.document,
  createElement: jest.fn(() => ({
    style: {},
    appendChild: jest.fn(),
  })),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

// 模拟 TextEncoder 和 TextDecoder
globalThis.TextEncoder = class {
  encode(input) {
    return Buffer.from(input, 'utf-8');
  }
};

globalThis.TextDecoder = class {
  decode(input) {
    return Buffer.from(input).toString('utf-8');
  }
};

// 模拟 console 方法，避免测试中过多的日志输出
console.log = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();