import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = true,
}) => {
  // 生成页码数组
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 否则显示当前页附近的页码
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // 调整起始页，确保显示足够的页码
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // 添加首页
      pages.push(1);
      
      // 如果起始页大于2，添加省略号
      if (startPage > 2) {
        pages.push(-1); // -1 表示省略号
      }
      
      // 添加中间页码
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      // 如果结束页小于totalPages-1，添加省略号
      if (endPage < totalPages - 1) {
        pages.push(-2); // -2 表示省略号
      }
      
      // 添加末页
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
      {/* 每页显示条数选择 */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm">每页显示：</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* 分页导航 */}
      <div className="flex items-center space-x-1">
        {/* 上一页 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-lg transition-colors duration-200 ${currentPage === 1 
            ? 'opacity-50 cursor-not-allowed' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white'}`}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        {/* 页码 */}
        {pageNumbers.map((page, index) => {
          if (page === -1 || page === -2) {
            return (
              <span key={index} className="px-3 py-1 text-gray-500 dark:text-gray-400">
                ...
              </span>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-lg transition-colors duration-200 ${currentPage === page 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white'}`}
            >
              {page}
            </button>
          );
        })}
        
        {/* 下一页 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-lg transition-colors duration-200 ${currentPage === totalPages 
            ? 'opacity-50 cursor-not-allowed' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white'}`}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      
      {/* 当前页信息 */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        第 {currentPage} / {totalPages} 页
      </div>
    </div>
  );
};