'use client'

import { ReactNode, useState } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import { clsx } from 'clsx'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  appearance?: 'primary' | 'secondary' | 'subtle' | 'danger'
  className?: string
}

export function Button({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false, 
  appearance = 'primary',
  className 
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const appearanceClasses = {
    primary: 'bg-atlassian-blue text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    subtle: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-atlassian-red text-white hover:bg-red-700 focus:ring-red-500'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(baseClasses, appearanceClasses[appearance], className)}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 spinner"></div>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  )
}

interface FieldTextProps {
  label: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FieldText({ 
  label, 
  placeholder, 
  value, 
  onChange, 
  type = 'text',
  required = false,
  disabled = false,
  className 
}: FieldTextProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={clsx('input-field', className)}
      />
    </div>
  )
}

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export function Checkbox({ label, checked, onChange, disabled = false }: CheckboxProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-4 h-4 text-atlassian-blue border-gray-300 rounded focus:ring-atlassian-blue"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  options: SelectOption[]
  value?: SelectOption
  onChange: (option: SelectOption | null) => void
  placeholder?: string
  disabled?: boolean
}

export function Select({ options, value, onChange, placeholder = 'Select...', disabled = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-atlassian-blue focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
      >
        <span className={clsx('block truncate', !value && 'text-gray-500')}>
          {value ? value.label : placeholder}
        </span>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option)
                setIsOpen(false)
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            >
              <div className="flex items-center justify-between">
                <span>{option.label}</span>
                {value?.value === option.value && (
                  <Check className="w-4 h-4 text-atlassian-blue" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ModalDialogProps {
  children: ReactNode
  onClose: () => void
  heading?: string
  width?: 'small' | 'medium' | 'large' | 'xl' | 'full'
}

export function ModalDialog({ children, onClose, heading, width = 'medium' }: ModalDialogProps) {
  const widthClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xl: 'max-w-6xl',
    full: 'max-w-[70vw]'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={clsx('modal-content max-h-[95vh] overflow-y-auto', widthClasses[width])}
        onClick={(e) => e.stopPropagation()}
      >
        {heading && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
}

export function Spinner({ size = 'medium' }: SpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className={clsx('spinner', sizeClasses[size])}></div>
  )
}

interface BadgeProps {
  children: ReactNode
  appearance?: 'success' | 'warning' | 'error' | 'info'
}

export function Badge({ children, appearance = 'info' }: BadgeProps) {
  const appearanceClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info'
  }

  return (
    <span className={clsx('badge', appearanceClasses[appearance])}>
      {children}
    </span>
  )
}

interface EmptyStateProps {
  header: string
  description: string
  action?: ReactNode
}

export function EmptyState({ header, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{header}</h3>
      <p className="text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  )
}

interface FieldRangeProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
}

export function FieldRange({ min, max, step, value, onChange }: FieldRangeProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
    />
  )
}
