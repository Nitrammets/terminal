import { DataGrid } from '@sylchi/reusable-components/dist/esm/index.mjs';

export default function OrderHistory({ history, pair }) {
  return <DataGrid
    columns={[{
      title: 'Time',
      field: 'time',
      format: (val, row) => new Date(val).toLocaleString()
    }, {
      title: 'Symbol',
      field: 'symbol',
      format: (val, row) => <div className="flex flex-row items-center font-sans">
        <div>
          <div className="font-bold text-xs">{val}</div>
          <div className="text-xs font-medium">Perpetual</div>
        </div>
      </div>
    }, {
      title: 'Type',
      field: 'type',
      format: val => <span className="capitalize">{val.toLowerCase().replace(/_/g, ' ')}</span>
    }, {
      title: 'Side',
      field: 'side',
      format: val => <span className={`capitalize ${val === 'SELL' ? 'text-negative' : 'text-positive'}`}>{val.toLowerCase().replace(/_/g, ' ')}</span>
    }, {
      title: 'Average',
      field: 'avgPrice',
      format: (val, row) => parseFloat(val) ? parseFloat(val).toFixed(2) : '-'
    }, {
      title: 'Price',
      field: 'price',
      format: val => parseFloat(val) ? parseFloat(val).toFixed(2) : '-'
    }, {
      title: 'Amount',
      field: 'origQty',
      format: (val, row) => row.closePosition ? 'Close Position' : val ? parseFloat(val).toFixed(2) : 'N/A'
    }, {
      title: 'Filled',
      field: 'executedQty',
      format: val => parseFloat(val).toFixed(2) + ' ' + pair[1]
    }, {
      title: 'Reduce Only',
      field: 'reduceOnly',
      format: val => val ? 'Yes' : 'No'
    }, {
      title: 'Post Only',
      field: 'timeInForce',
      format: val => val === 'GTX' ? 'Yes' : 'No'
    }, {
      title: 'Trigger Conditions',
      field: '',
    }, {
      title: 'Status',
      field: 'status',
      format: val => <span className="capitalize">{val.toLowerCase().replace(/_/g, ' ')}</span>
    }]}
    rows={history}
    classes={{
      cellClasses: 'pl-2 flex flex-col justify-center text-sm text-gray-600 monofont py-1 dark:text-gray-200',
      headerClasses: 'text-xs py-1 shadow-sm font-normal text-gray-600 dark:text-gray-300 dark:bg-darkTerminalDark dark:border-b dark:border-darkTerminalBorder',
      containerClasses: 'shadow-none overflow-y-scroll grid-rows-minContent no-scrollbar',
      evenRowClasses: 'bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark',
      oddRowClasses: 'bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark'
    }}
  />
}
