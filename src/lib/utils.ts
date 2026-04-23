import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdown(text: string): string {
  if (!text) return ''
  return text
    // Remove headers
    .replace(/^(#+)(.*)$/gm, '$2')
    // Remove blockquotes
    .replace(/^(\s*>\s*)(.*)$/gm, '$2')
    // Remove bold/italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough
    .replace(/~~(.*?)~~/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove images
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    // Remove links
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    // Remove html tags
    .replace(/<[^>]*>/g, '')
    // Remove extra newlines
    .replace(/\n+/g, ' ')
    .trim()
}
