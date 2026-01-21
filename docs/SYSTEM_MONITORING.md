# 系统监控与安全方案建议

## 1. 监控指标

为了确保认证系统的稳定性和安全性，建议实施以下监控指标：

### 1.1 业务指标
- **注册成功率/失败率**: 监控每日新增用户数及注册失败的原因（如验证码错误、邮箱重复等）。
- **登录成功率/失败率**: 区分登录方式（密码、验证码、GitHub）监控成功率。异常高的失败率可能意味着攻击。
- **短信/邮件发送成功率**: 监控第三方服务（SendGrid/Twilio/阿里云）的发送状态，及时发现服务商故障。
- **GitHub 授权回调失败率**: 监控 OAuth 流程中的失败情况。

### 1.2 系统指标
- **API 响应时间 (Latency)**: 尤其是 `/api/auth/login` 和 `/api/auth/register` 接口。
- **错误率 (Error Rate)**: 监控 HTTP 500 错误的发生频率。
- **吞吐量 (Throughput)**: 每分钟请求数 (RPM)。
- **CPU/内存使用率**: 防止资源耗尽导致服务不可用。

### 1.3 安全指标
- **验证码请求频率**: 监控单一 IP 或手机号的验证码请求次数，防止短信轰炸。
- **登录尝试次数**: 监控单一账户的连续失败次数，检测暴力破解。

## 2. 日志记录策略

- **结构化日志**: 使用 JSON 格式记录日志，便于 ELK (Elasticsearch, Logstash, Kibana) 或 Datadog 解析。
- **关键字段**:
  - `timestamp`: 时间戳
  - `level`: 日志级别 (INFO, WARN, ERROR)
  - `trace_id`: 请求追踪 ID
  - `user_id`: 用户 ID (如有)
  - `ip`: 客户端 IP (注意脱敏)
  - `action`: 操作类型 (login, register, send_sms)
  - `status`: 操作结果 (success, failed)
  - `error_code`: 错误码
- **脱敏处理**: 严禁记录密码明文、Token、验证码明文等敏感信息。

## 3. 告警策略

- **高优先级告警 (P0)**:
  - 系统宕机 (Health Check 失败)
  - 数据库连接失败
  - 短信/邮件服务完全不可用
- **中优先级告警 (P1)**:
  - 登录失败率 > 10% (持续 5 分钟)
  - API 响应时间 > 2s (P95)
  - 验证码发送失败率 > 5%
- **低优先级告警 (P2)**:
  - CPU 使用率 > 80%
  - 磁盘空间不足警告

## 4. 安全加固建议

1.  **HTTPS 强制**: 生产环境必须配置 SSL 证书，并启用 HSTS。
2.  **Rate Limiting**: 在 Nginx 或网关层配置全局限流，防止 DDoS。
3.  **WAF (Web Application Firewall)**: 部署 WAF 拦截 SQL 注入、XSS 攻击。
4.  **Token 管理**: Access Token 有效期设为短时间 (如 2 小时)，Refresh Token 设为长时间。
5.  **依赖扫描**: 定期运行 `npm audit` 检查依赖库漏洞。

## 5. 推荐工具栈

- **日志收集**: ELK Stack, Loki + Grafana
- **应用监控 (APM)**: Sentry (错误追踪), Prometheus + Grafana (指标监控)
- **可用性监控**: UptimeRobot (外部探针)
