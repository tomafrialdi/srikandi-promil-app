import type { TextareaHTMLAttributes } from 'react'
import styles from './TextAreaField.module.css'

export function TextAreaField({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${styles.area} ${className ?? ''}`} {...rest} />
}
