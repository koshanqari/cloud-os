'use client'

import { ReactNode } from 'react'
import { MoreHorizontal, Download, Trash2, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

interface TableColumn {
  key: string
  content: string
  width?: number
}

interface TableRow {
  key: string
  cells: Array<{
    key: string
    content: ReactNode
  }>
}

interface TableProps {
  columns: TableColumn[]
  rows: TableRow[]
}

export function Table({ columns, rows }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width ? `${column.width}%` : 'auto' }}>
                {column.content}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell) => (
                <td key={cell.key}>{cell.content}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 overflow-visible">
            <div className="py-1">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: ReactNode
  onClick: (e: React.MouseEvent) => void
}

export function DropdownItem({ children, onClick }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
    >
      {children}
    </button>
  )
}

interface DropdownItemGroupProps {
  children: ReactNode
}

export function DropdownItemGroup({ children }: DropdownItemGroupProps) {
  return <>{children}</>
}
