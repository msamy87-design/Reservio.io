
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useData } from '../contexts/DataContext';
import { ArrowDownTrayIcon, ChevronDownIcon } from '../components/Icons';

type ReportRow = {
  id: string;
  name: string;
  bookingsCount?: number;
  quantitySold?: number;
  revenue: number;
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const convertToCSV = (data: ReportRow[], headers: { key: keyof ReportRow, label: string }[]) => {
    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    const bodyRows = data.map(row => {
        return headers.map(h => {
            let value = row[h.key];
            if (typeof value === 'string') {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    return [headerRow, ...bodyRows].join('\n');
};

const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const ReportChart: React.FC<{ data: ReportRow[], dataKey: 'revenue' | 'quantitySold' }> = ({ data, dataKey }) => {
    const isRevenue = dataKey === 'revenue';
    return (
        <div className="h-80 w-full mb-6 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis 
                        tickFormatter={(value) => isRevenue ? formatCurrency(value as number) : value} 
                        tick={{ fontSize: 12 }} 
                        width={isRevenue ? 100 : 50}
                    />
                    <Tooltip
                        formatter={(value: number) => [isRevenue ? formatCurrency(value) : value, isRevenue ? 'Revenue' : 'Quantity Sold']}
                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                        contentStyle={{
                            backgroundColor: 'rgba(31, 41, 55, 0.9)',
                            borderColor: 'rgba(75, 85, 99, 1)',
                            borderRadius: '0.5rem',
                            color: '#fff',
                        }}
                        labelStyle={{ color: '#cbd5e1' }}
                    />
                    <Bar dataKey={dataKey} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const ReportCard: React.FC<{ title: string; data: ReportRow[]; isLoading: boolean; filename: string; headers: { key: keyof ReportRow, label: string }[]; totalKey: keyof ReportRow, isCurrency: boolean, chartKey: 'revenue' | 'quantitySold' }> = ({ title, data, isLoading, filename, headers, totalKey, isCurrency, chartKey }) => {
    const total = useMemo(() => data.reduce((sum, row) => sum + (row[totalKey] as number || 0), 0), [data, totalKey]);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = (format: 'csv' | 'pdf') => {
        if (data.length === 0) return;
        setIsExportOpen(false);

        if (format === 'csv') {
            const csvString = convertToCSV(data, headers);
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            downloadFile(blob, `${filename}.csv`);
        } else if (format === 'pdf') {
            const doc = new jsPDF();
            const tableData = data.map(row => headers.map(h => {
                const value = row[h.key];
                return h.key === 'revenue' ? formatCurrency(value as number) : value;
            }));
            const totalValue = isCurrency ? formatCurrency(total) : total;
            
            (doc as any).autoTable({
                head: [headers.map(h => h.label)],
                body: tableData,
                foot: [['Total', ...Array(headers.length - 2).fill(''), totalValue]],
                footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold', halign: 'right' },
                didDrawPage: (data: any) => {
                    doc.setFontSize(20);
                    doc.text(title, data.settings.margin.left, 15);
                }
            });
            doc.save(`${filename}.pdf`);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        disabled={isLoading || data.length === 0}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Export
                        <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    {isExportOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                                <button onClick={() => handleExport('csv')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Export as CSV</button>
                                <button onClick={() => handleExport('pdf')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Export as PDF</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isLoading ? (
                 <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading chart...</div>
            ) : data.length > 0 ? (
                <ReportChart data={data} dataKey={chartKey}/>
            ) : null}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            {headers.map(h => <th key={h.key as string} scope="col" className={`px-6 py-3 ${h.key !== 'name' ? 'text-right' : ''}`}>{h.label}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={headers.length} className="text-center py-10">Calculating report...</td></tr>
                        ) : data.length === 0 ? (
                             <tr><td colSpan={headers.length} className="text-center py-10">No data for the selected period.</td></tr>
                        ) : (
                            data.map(row => (
                                <tr key={row.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    {headers.map(h => (
                                        <td key={h.key as string} className={`px-6 py-4 ${h.key !== 'name' ? 'text-right font-mono' : 'font-medium text-gray-900 dark:text-white'}`}>
                                            {h.key === 'revenue' ? formatCurrency(row[h.key] as number) : row[h.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">
                            <th scope="row" className="px-6 py-3 text-base">Total</th>
                            {headers.slice(1).map(h => (
                                <td key={`total-${h.key as string}`} className="px-6 py-3 text-right font-mono">
                                    {isCurrency && h.key === totalKey ? formatCurrency(total) : (h.key === totalKey ? total : '')}
                                </td>
                            ))}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


const ReportsPage: React.FC = () => {
    const { transactions, bookings, loading: isLoading } = useData();
    
    const getMonthDateRange = () => {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    };

    const [dateRange, setDateRange] = useState(getMonthDateRange());

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const filteredTransactions = useMemo(() => {
        if (!dateRange.start || !dateRange.end) return [];

        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const startTime = start.getTime();

        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        const endTime = end.getTime();

        return transactions.filter(t => {
            const transactionTime = new Date(t.created_at).getTime();
            return transactionTime >= startTime && transactionTime <= endTime;
        });
    }, [transactions, dateRange]);

    const revenueByService = useMemo<ReportRow[]>(() => {
        const serviceMap = new Map<string, { name: string; bookingsCount: number; revenue: number }>();

        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                if (item.type === 'service') {
                    const current = serviceMap.get(item.id) || { name: item.name, bookingsCount: 0, revenue: 0 };
                    current.bookingsCount += item.quantity;
                    current.revenue += item.unit_price * item.quantity; // Price at time of sale
                    serviceMap.set(item.id, current);
                }
            });
        });

        return Array.from(serviceMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredTransactions]);

    const revenueByStaff = useMemo<ReportRow[]>(() => {
        const staffMap = new Map<string, { name: string; bookingsCount: number; revenue: number }>();
        
        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                if (item.type === 'service' && item.staffId && item.staffName) {
                    const staffId = item.staffId;
                    const staffName = item.staffName;
                    const revenue = item.unit_price * item.quantity;

                    const current = staffMap.get(staffId) || { name: staffName, bookingsCount: 0, revenue: 0 };
                    current.bookingsCount += item.quantity;
                    current.revenue += revenue;
                    staffMap.set(staffId, current);
                }
            });
        });

        return Array.from(staffMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a,b) => b.revenue - a.revenue);
    }, [filteredTransactions]);

    const topSellingProducts = useMemo<ReportRow[]>(() => {
        const productMap = new Map<string, { name: string; quantitySold: number; revenue: number }>();
        filteredTransactions.forEach(t => {
            t.items.forEach(item => {
                if(item.type === 'product') {
                    const current = productMap.get(item.id) || { name: item.name, quantitySold: 0, revenue: 0 };
                    current.quantitySold += item.quantity;
                    current.revenue += item.unit_price * item.quantity;
                    productMap.set(item.id, current);
                }
            });
        });
        return Array.from(productMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantitySold - a.quantitySold);
    }, [filteredTransactions]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Reports</h2>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Analyze your business performance.</p>
                </div>
                <div className="flex items-center gap-4">
                     <input
                        type="date"
                        name="start"
                        value={dateRange.start}
                        onChange={handleDateChange}
                        className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                        type="date"
                        name="end"
                        value={dateRange.end}
                        onChange={handleDateChange}
                        className="block w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
            </div>

            <div className="space-y-8">
                <ReportCard 
                    title="Revenue by Service" 
                    data={revenueByService} 
                    isLoading={isLoading} 
                    filename={`revenue_by_service_${dateRange.start}_to_${dateRange.end}`}
                    headers={[ { key: 'name', label: 'Service' }, { key: 'bookingsCount', label: 'Count' }, { key: 'revenue', label: 'Revenue' } ]}
                    totalKey="revenue"
                    isCurrency={true}
                    chartKey="revenue"
                />
                 <ReportCard 
                    title="Revenue by Staff" 
                    data={revenueByStaff} 
                    isLoading={isLoading} 
                    filename={`revenue_by_staff_${dateRange.start}_to_${dateRange.end}`}
                    headers={[ { key: 'name', label: 'Staff' }, { key: 'bookingsCount', label: 'Services Sold' }, { key: 'revenue', label: 'Revenue' } ]}
                    totalKey="revenue"
                    isCurrency={true}
                    chartKey="revenue"
                />
                 <ReportCard 
                    title="Top Selling Products" 
                    data={topSellingProducts} 
                    isLoading={isLoading} 
                    filename={`top_products_${dateRange.start}_to_${dateRange.end}`}
                    headers={[ { key: 'name', label: 'Product' }, { key: 'quantitySold', label: 'Quantity Sold' }, { key: 'revenue', label: 'Revenue' } ]}
                    totalKey="revenue"
                    isCurrency={true}
                    chartKey="quantitySold"
                />
            </div>
        </div>
    );
};

export default ReportsPage;