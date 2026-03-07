// src/components/ui/Table.tsx

import React, { ReactNode, HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

// Table 组件
interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={clsx('w-full text-sm text-left', className)}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
});

Table.displayName = 'Table';

// TableHeader 组件
interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <thead
      ref={ref}
      className={clsx('text-xs text-gray-700 uppercase bg-gray-50', className)}
      {...rest}
    >
      {children}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

// TableBody 组件
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <tbody
      ref={ref}
      className={clsx('', className)}
      {...rest}
    >
      {children}
    </tbody>
  );
});

TableBody.displayName = 'TableBody';

// TableRow 组件
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <tr
      ref={ref}
      className={clsx('bg-white border-b hover:bg-gray-50', className)}
      {...rest}
    >
      {children}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

// TableHead 组件
interface TableHeadProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <th
      ref={ref}
      scope="col"
      className={clsx('px-6 py-3 font-medium', className)}
      {...rest}
    >
      {children}
    </th>
  );
});

TableHead.displayName = 'TableHead';

// TableCell 组件
interface TableCellProps extends HTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <td
      ref={ref}
      className={clsx('px-6 py-4', className)}
      {...rest}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';

// TableCaption 组件
interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {
  children: ReactNode;
}

const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>((props, ref) => {
  const { children, className, ...rest } = props;
  return (
    <caption
      ref={ref}
      className={clsx('p-5 text-lg font-semibold text-left text-gray-900 bg-white', className)}
      {...rest}
    >
      {children}
    </caption>
  );
});

TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
