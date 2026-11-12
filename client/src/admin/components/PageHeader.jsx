import { Flex, Typography } from 'antd';

export default function PageHeader({ title, subtitle, extra, children, style }) {
  return (
    <div className="saas-page-header" style={style}>
      <div>
        <Typography.Title level={4} className="saas-page-title">
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text type="secondary" className="saas-page-subtitle" style={{ display: 'block' }}>
            {subtitle}
          </Typography.Text>
        )}
      </div>
      {extra && <Flex align="center" gap={8} wrap>{extra}</Flex>}
      {children}
    </div>
  );
}
