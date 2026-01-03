'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface AuditLog {
    id: string;
    runAt: string;
    totalWallets: number;
    walletsChecked: number;
    discrepancyCount: number;
    status: string;
    durationMs: number;
    details: any[] | null;
    resolvedAt: string | null;
    resolvedByUserId: string | null;
    resolutionNote: string | null;
}

export default function LedgerAuditPage() {
    const [audits, setAudits] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [runningAudit, setRunningAudit] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<AuditLog | null>(null);
    const [resolveNote, setResolveNote] = useState('');

    const fetchAudits = async () => {
        try {
            const res = await api.get('/admin/ledger-audit?limit=20');
            setAudits(res.data);
        } catch (err) {
            console.error('Failed to fetch audits:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudits();
    }, []);

    const handleRunAudit = async () => {
        if (!confirm('Run a new ledger audit? This may take a moment.')) return;
        setRunningAudit(true);
        try {
            await api.post('/admin/ledger-audit/run');
            fetchAudits();
        } catch (err) {
            console.error('Failed to run audit:', err);
            alert('Failed to run audit');
        } finally {
            setRunningAudit(false);
        }
    };

    const handleResolve = async (id: string) => {
        if (!resolveNote.trim()) {
            alert('Please enter a resolution note');
            return;
        }
        try {
            await api.patch(`/admin/ledger-audit/${id}/resolve`, { note: resolveNote });
            setSelectedAudit(null);
            setResolveNote('');
            fetchAudits();
        } catch (err) {
            console.error('Failed to resolve:', err);
            alert('Failed to resolve audit');
        }
    };

    const getStatusBadge = (status: string, resolved: boolean) => {
        if (resolved) {
            return <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white">Resolved</span>;
        }
        switch (status) {
            case 'SUCCESS':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white">✅ Balanced</span>;
            case 'DISCREPANCY_FOUND':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-500 text-white">⚠️ Discrepancy</span>;
            case 'ERROR':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 text-white">❌ Error</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-400 text-white">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Ledger Audit</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">📊 Ledger Audit</h1>
                <button
                    onClick={handleRunAudit}
                    disabled={runningAudit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {runningAudit ? 'Running...' : '🔄 Run Audit Now'}
                </button>
            </div>

            <p className="text-gray-600 mb-4">
                Double-entry ledger verification runs daily at 3:00 AM. It compares stored wallet balances
                against the sum of all approved transactions to detect discrepancies.
            </p>

            {audits.length === 0 ? (
                <div className="bg-gray-100 p-8 rounded text-center">
                    <p className="text-gray-500">No audit logs yet. Run the first audit to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallets</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discrepancies</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {audits.map((audit) => (
                                <tr key={audit.id} className={audit.discrepancyCount > 0 && !audit.resolvedAt ? 'bg-red-50' : ''}>
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(audit.runAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getStatusBadge(audit.status, !!audit.resolvedAt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {audit.walletsChecked} / {audit.totalWallets}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {audit.discrepancyCount > 0 ? (
                                            <span className="text-red-600 font-bold">{audit.discrepancyCount}</span>
                                        ) : (
                                            <span className="text-green-600">0</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {audit.durationMs}ms
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {audit.discrepancyCount > 0 && !audit.resolvedAt && (
                                            <button
                                                onClick={() => setSelectedAudit(audit)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                View & Resolve
                                            </button>
                                        )}
                                        {audit.resolvedAt && (
                                            <span className="text-gray-400 text-xs">
                                                Resolved: {audit.resolutionNote?.substring(0, 30)}...
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Discrepancy Detail Modal */}
            {selectedAudit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">⚠️ Discrepancy Details</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Audit from {new Date(selectedAudit.runAt).toLocaleString()}
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
                            <h3 className="font-semibold mb-2">Found {selectedAudit.discrepancyCount} discrepancy(ies):</h3>
                            {selectedAudit.details?.map((d: any, i: number) => (
                                <div key={i} className="bg-white border rounded p-3 mb-2">
                                    <p><strong>Wallet:</strong> {d.readableId || d.walletId}</p>
                                    <p><strong>Stored Balance:</strong> {d.storedBalance} SDG</p>
                                    <p><strong>Calculated Balance:</strong> {d.calculatedBalance} SDG</p>
                                    <p className={d.difference > 0 ? 'text-red-600' : 'text-orange-600'}>
                                        <strong>Difference:</strong> {d.difference > 0 ? '+' : ''}{d.difference} SDG
                                        ({d.difference > 0 ? 'Over-reported' : 'Under-reported'})
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Resolution Note</label>
                            <textarea
                                value={resolveNote}
                                onChange={(e) => setResolveNote(e.target.value)}
                                className="w-full border rounded p-2"
                                rows={3}
                                placeholder="Describe the investigation and resolution..."
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => { setSelectedAudit(null); setResolveNote(''); }}
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleResolve(selectedAudit.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Mark Resolved
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
