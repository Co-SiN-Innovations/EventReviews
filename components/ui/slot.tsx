import * as React from "react"

interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode
}

/**
 * A simple implementation of the Slot component that merges props from parent to child
 */
const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (!React.isValidElement(children)) {
    return null
  }

  return React.cloneElement(children, {
    ...props,
    ref: ref ? mergeRefs([ref, (children as any).ref]) : (children as any).ref,
  })
})

Slot.displayName = "Slot"

/**
 * Utility to merge multiple refs
 */
function mergeRefs(refs: React.Ref<any>[]) {
  return (value: any) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<any>).current = value
      }
    })
  }
}

export { Slot }

