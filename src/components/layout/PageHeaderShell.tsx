import React from 'react'

interface PageHeaderShellProps {
  children: React.ReactNode
  sticky?: boolean
}

const PageHeaderShell: React.FC<PageHeaderShellProps> = ({ children, sticky = false }) => {
  return (
    <div className="px-2 pt-4">
      <header className={`bg-white border border-slate-300 rounded-xl ${sticky ? 'sticky top-0 z-40' : ''}`}>
        <div className="px-2 py-4">
          {children}
        </div>
      </header>
    </div>
  )
}

export default PageHeaderShell