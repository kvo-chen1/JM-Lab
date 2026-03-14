import React from 'react';
import './DewuLoader.css';

export type DewuLoaderSize = 'sm' | 'md' | 'lg';

export interface DewuLoaderProps {
  size?: DewuLoaderSize;
  className?: string;
}

const sizeMap = {
  sm: { frame: 150, svg: 172 },
  md: { frame: 300, svg: 344 },
  lg: { frame: 450, svg: 516 },
};

export const DewuLoader: React.FC<DewuLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  const { frame, svg } = sizeMap[size];

  return (
    <div
      className={`dewu-loader-container ${className}`}
      style={{ width: frame, height: frame }}
    >
      <div className="dewu-svg-frame">
        {/* 外层圆环 - 荧光绿 */}
        <svg
          width={svg}
          height={svg}
          style={{ '--i': 0, '--j': 0 } as React.CSSProperties}
        >
          <g id="dewu-out1">
            <path
              d={`M${svg * 0.209} ${svg * 0.5}C${svg * 0.209} ${svg * 0.34} ${svg * 0.34} ${svg * 0.209} ${svg * 0.5} ${svg * 0.209}C${svg * 0.66} ${svg * 0.209} ${svg * 0.791} ${svg * 0.34} ${svg * 0.791} ${svg * 0.5}C${svg * 0.791} ${svg * 0.66} ${svg * 0.66} ${svg * 0.791} ${svg * 0.5} ${svg * 0.791}C${svg * 0.34} ${svg * 0.791} ${svg * 0.209} ${svg * 0.66} ${svg * 0.209} ${svg * 0.5}ZM${svg * 0.574} ${svg * 0.5}C${svg * 0.574} ${svg * 0.459} ${svg * 0.541} ${svg * 0.426} ${svg * 0.5} ${svg * 0.426}C${svg * 0.459} ${svg * 0.426} ${svg * 0.426} ${svg * 0.459} ${svg * 0.426} ${svg * 0.5}C${svg * 0.426} ${svg * 0.541} ${svg * 0.459} ${svg * 0.574} ${svg * 0.5} ${svg * 0.574}C${svg * 0.541} ${svg * 0.574} ${svg * 0.574} ${svg * 0.541} ${svg * 0.574} ${svg * 0.5}Z`}
            />
            <path
              mask="url(#dewu-path-1-inside)"
              strokeMiterlimit={16}
              strokeWidth={2}
              stroke="#39FF14"
              d={`M${svg * 0.209} ${svg * 0.5}C${svg * 0.209} ${svg * 0.34} ${svg * 0.34} ${svg * 0.209} ${svg * 0.5} ${svg * 0.209}C${svg * 0.66} ${svg * 0.209} ${svg * 0.791} ${svg * 0.34} ${svg * 0.791} ${svg * 0.5}C${svg * 0.791} ${svg * 0.66} ${svg * 0.66} ${svg * 0.791} ${svg * 0.5} ${svg * 0.791}C${svg * 0.34} ${svg * 0.791} ${svg * 0.209} ${svg * 0.66} ${svg * 0.209} ${svg * 0.5}ZM${svg * 0.574} ${svg * 0.5}C${svg * 0.574} ${svg * 0.459} ${svg * 0.541} ${svg * 0.426} ${svg * 0.5} ${svg * 0.426}C${svg * 0.459} ${svg * 0.426} ${svg * 0.426} ${svg * 0.459} ${svg * 0.426} ${svg * 0.5}C${svg * 0.426} ${svg * 0.541} ${svg * 0.459} ${svg * 0.574} ${svg * 0.5} ${svg * 0.574}C${svg * 0.541} ${svg * 0.574} ${svg * 0.574} ${svg * 0.541} ${svg * 0.574} ${svg * 0.5}Z`}
              className="dewu-glow"
            />
          </g>
          <defs>
            <mask id="dewu-path-1-inside">
              <path
                fill="white"
                d={`M${svg * 0.209} ${svg * 0.5}C${svg * 0.209} ${svg * 0.34} ${svg * 0.34} ${svg * 0.209} ${svg * 0.5} ${svg * 0.209}C${svg * 0.66} ${svg * 0.209} ${svg * 0.791} ${svg * 0.34} ${svg * 0.791} ${svg * 0.5}C${svg * 0.791} ${svg * 0.66} ${svg * 0.66} ${svg * 0.791} ${svg * 0.5} ${svg * 0.791}C${svg * 0.34} ${svg * 0.791} ${svg * 0.209} ${svg * 0.66} ${svg * 0.209} ${svg * 0.5}ZM${svg * 0.574} ${svg * 0.5}C${svg * 0.574} ${svg * 0.459} ${svg * 0.541} ${svg * 0.426} ${svg * 0.5} ${svg * 0.426}C${svg * 0.459} ${svg * 0.426} ${svg * 0.426} ${svg * 0.459} ${svg * 0.426} ${svg * 0.5}C${svg * 0.426} ${svg * 0.541} ${svg * 0.459} ${svg * 0.574} ${svg * 0.5} ${svg * 0.574}C${svg * 0.541} ${svg * 0.574} ${svg * 0.574} ${svg * 0.541} ${svg * 0.574} ${svg * 0.5}Z`}
              />
            </mask>
          </defs>
        </svg>

        {/* 中层装饰 - 白色 + 荧光绿点缀 */}
        <svg
          width={svg}
          height={svg}
          style={{ '--i': 1, '--j': 1 } as React.CSSProperties}
        >
          <g id="dewu-out2">
            <circle
              cx={svg * 0.5}
              cy={svg * 0.5}
              r={svg * 0.35}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              strokeDasharray={`${svg * 0.11} ${svg * 0.055}`}
              opacity={0.8}
            />
            <circle
              cx={svg * 0.5}
              cy={svg * 0.5}
              r={svg * 0.3}
              fill="none"
              stroke="#39FF14"
              strokeWidth={2}
              strokeDasharray={`${svg * 0.082} ${svg * 0.041}`}
              className="dewu-glow"
            />
          </g>
        </svg>

        {/* 内层旋转环 - 荧光绿高亮 */}
        <svg
          width={svg}
          height={svg}
          style={{ '--i': 2, '--j': 2 } as React.CSSProperties}
        >
          <g id="dewu-out3">
            <circle
              cx={svg * 0.5}
              cy={svg * 0.5}
              r={svg * 0.22}
              fill="none"
              stroke="#39FF14"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={`${svg * 0.69} ${svg * 0.69}`}
              className="dewu-glow-intense"
            />
          </g>
        </svg>

        {/* 中心点 - 荧光绿实心 */}
        <svg
          width={svg}
          height={svg}
          style={{ '--i': 3, '--j': 3 } as React.CSSProperties}
        >
          <g id="dewu-center">
            <circle
              cx={svg * 0.5}
              cy={svg * 0.5}
              r={svg * 0.08}
              fill="#39FF14"
              className="dewu-glow-intense"
            />
            <circle
              cx={svg * 0.5}
              cy={svg * 0.5}
              r={svg * 0.04}
              fill="#000000"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default DewuLoader;
