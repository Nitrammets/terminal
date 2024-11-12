import { useEffect, useState } from 'react';

export default function SelectableMenu({ items, selected, setSelected, className, style }: { items: any[], selected: string, setSelected: (selected: string) => void, className?: string, style?: any}) {
  const [open, setIsOpen] = useState(false);
  const [ourSelected, setOurSelected] = useState(items.includes(selected) ? selected : items[0]);

  return (
    <div className={`z-50 relative ${className}`} style={style} >
      <div className="flex flex-row items-center gap-x-1" onClick={() => selected !== ourSelected && setSelected(ourSelected)}>
        <button className={`text-sm font-semibold ${ourSelected === selected ? 'tab-active' : 'text-gray-600 dark:text-gray-300'}`}>{ourSelected}</button>
        <button onClick={() => setIsOpen(true)}><svg onMouseEnter={() => setIsOpen(true)} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m7 10l5 5l5-5H7Z"/></svg></button>
      </div>
      <div onMouseLeave={() => setIsOpen(false)} className={`${open ? 'flex' : 'hidden' } flex-col absolute bg-white dark:bg-darkDarkBlue shadow-lg z-50 p-4 flex gap-y-4`}>
        {items.map(item => <button className={`text-left font-semibold whitespace-nowrap text-sm ${selected === item && 'tab-active'}`} key={item} onClick={() => {
          setOurSelected(item);
          setSelected(item);
          setIsOpen(false);
        }}>{item}</button>)}
      </div>
    </div>

  )
}