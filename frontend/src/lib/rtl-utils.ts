import { cn } from '@/lib/utils'

/**
 * RTL-aware utility functions for Tailwind CSS classes
 * These functions automatically handle direction-dependent classes based on text direction
 */

export interface RTLAwareClasses {
  /** Margin start (left in LTR, right in RTL) */
  ms?: string
  /** Margin end (right in LTR, left in RTL) */
  me?: string
  /** Padding start (left in LTR, right in RTL) */
  ps?: string
  /** Padding end (right in LTR, left in RTL) */
  pe?: string
  /** Border start (left in LTR, right in RTL) */
  bs?: string
  /** Border end (right in LTR, left in RTL) */
  be?: string
  /** Text alignment start (left in LTR, right in RTL) */
  textStart?: boolean
  /** Text alignment end (right in LTR, left in RTL) */
  textEnd?: boolean
  /** Justify content start (flex-start in LTR, flex-end in RTL) */
  justifyStart?: boolean
  /** Justify content end (flex-end in LTR, flex-start in RTL) */
  justifyEnd?: boolean
  /** Flex direction row reverse in RTL */
  flexRowReverse?: boolean
}

/**
 * Creates RTL-aware classes that automatically flip based on text direction
 */
export function rtlClasses(classes: RTLAwareClasses): string {
  const classNames: string[] = []

  // Margin classes
  if (classes.ms) {
    classNames.push(`ml-${classes.ms}`, `rtl:mr-${classes.ms}`, `rtl:ml-0`)
  }
  if (classes.me) {
    classNames.push(`mr-${classes.me}`, `rtl:ml-${classes.me}`, `rtl:mr-0`)
  }

  // Padding classes
  if (classes.ps) {
    classNames.push(`pl-${classes.ps}`, `rtl:pr-${classes.ps}`, `rtl:pl-0`)
  }
  if (classes.pe) {
    classNames.push(`pr-${classes.pe}`, `rtl:pl-${classes.pe}`, `rtl:pr-0`)
  }

  // Border classes
  if (classes.bs) {
    classNames.push(`border-l-${classes.bs}`, `rtl:border-r-${classes.bs}`, `rtl:border-l-0`)
  }
  if (classes.be) {
    classNames.push(`border-r-${classes.be}`, `rtl:border-l-${classes.be}`, `rtl:border-r-0`)
  }

  // Text alignment
  if (classes.textStart) {
    classNames.push('text-left', 'rtl:text-right')
  }
  if (classes.textEnd) {
    classNames.push('text-right', 'rtl:text-left')
  }

  // Flexbox justify content
  if (classes.justifyStart) {
    classNames.push('justify-start', 'rtl:justify-end')
  }
  if (classes.justifyEnd) {
    classNames.push('justify-end', 'rtl:justify-start')
  }

  // Flex direction
  if (classes.flexRowReverse) {
    classNames.push('rtl:flex-row-reverse')
  }

  return cn(...classNames)
}

/**
 * Quick utility functions for common RTL patterns
 */
export const rtl = {
  /** Margin start (left in LTR, right in RTL) */
  ms: (size: string) => rtlClasses({ ms: size }),
  /** Margin end (right in LTR, left in RTL) */
  me: (size: string) => rtlClasses({ me: size }),
  /** Padding start (left in LTR, right in RTL) */
  ps: (size: string) => rtlClasses({ ps: size }),
  /** Padding end (right in LTR, left in RTL) */
  pe: (size: string) => rtlClasses({ pe: size }),
  /** Text alignment start */
  textStart: () => rtlClasses({ textStart: true }),
  /** Text alignment end */
  textEnd: () => rtlClasses({ textEnd: true }),
  /** Justify content start */
  justifyStart: () => rtlClasses({ justifyStart: true }),
  /** Justify content end */
  justifyEnd: () => rtlClasses({ justifyEnd: true }),
  /** Flex row reverse for RTL */
  flexRowReverse: () => rtlClasses({ flexRowReverse: true }),
}

/**
 * Legacy class mapping for quick replacement of existing directional classes
 */
export function mapDirectionalClass(className: string): string {
  const mappings: Record<string, string> = {
    // Margin classes
    'ml-1': rtl.ms('1'),
    'ml-2': rtl.ms('2'),
    'ml-3': rtl.ms('3'),
    'ml-4': rtl.ms('4'),
    'ml-6': rtl.ms('6'),
    'ml-8': rtl.ms('8'),
    'ml-auto': 'ml-auto rtl:mr-auto rtl:ml-0',
    'mr-1': rtl.me('1'),
    'mr-2': rtl.me('2'),
    'mr-3': rtl.me('3'),
    'mr-4': rtl.me('4'),
    'mr-6': rtl.me('6'),
    'mr-8': rtl.me('8'),
    'mr-auto': 'mr-auto rtl:ml-auto rtl:mr-0',

    // Padding classes
    'pl-1': rtl.ps('1'),
    'pl-2': rtl.ps('2'),
    'pl-3': rtl.ps('3'),
    'pl-4': rtl.ps('4'),
    'pl-6': rtl.ps('6'),
    'pl-8': rtl.ps('8'),
    'pr-1': rtl.pe('1'),
    'pr-2': rtl.pe('2'),
    'pr-3': rtl.pe('3'),
    'pr-4': rtl.pe('4'),
    'pr-6': rtl.pe('6'),
    'pr-8': rtl.pe('8'),

    // Text alignment
    'text-left': rtl.textStart(),
    'text-right': rtl.textEnd(),

    // Flexbox
    'justify-start': rtl.justifyStart(),
    'justify-end': rtl.justifyEnd(),
  }

  return mappings[className] || className
}

/**
 * Process a className string and replace directional classes with RTL-aware ones
 */
export function processRTLClasses(classNames: string): string {
  return classNames
    .split(' ')
    .map(className => mapDirectionalClass(className.trim()))
    .join(' ')
}