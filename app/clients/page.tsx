'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useClient, ClientProfile } from '../../lib/client-context';
import TrustCertificationStrip from '../../components/design-system/TrustCertificationStrip';

export const dynamic = 'force-dynamic';

function ClientsPortfolioContent() {
  const router = useRouter();
  const {
    clientRegistry,
    activeClient,
    setActiveClient,
    isLoading,
    registryState,
    refreshClients,
  } = useClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'CERTIFIED' | 'UNCERTIFIED'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formStoreCode, setFormStoreCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredClients = clientRegistry.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.store_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.domain || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterMode === 'CERTIFIED') return c.is_certified;
    if (filterMode === 'UNCERTIFIED') return !c.is_certified;
    return true;
  });

  const openCreateModal = () => {
    setEditingClient(null);
    setFormName('');
    setFormAddress('');
    setFormDomain('');
    setFormStoreCode('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (client: ClientProfile) => {
    setEditingClient(client);
    setFormName(client.name || '');
    setFormAddress(client.address || '');
    setFormDomain(client.domain || '');
    setFormStoreCode(client.store_code || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const endpoint = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          address: formAddress.trim() || null,
          domain: formDomain.trim() || null,
          store_code: formStoreCode.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data?.error?.message || 'Failed to save client record.');
        return;
      }

      await refreshClients();
      if (data.client) {
        setActiveClient(data.client);
      }
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Network error while saving client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F4F7FB] text-[#0B1F3A]">
      <TrustCertificationStrip
        client={activeClient}
        trustState={activeClient?.is_certified ? 'CERTIFIED_LIVE' : 'UNMAPPED_SETUP'}
        recordCount={clientRegistry.length}
      />

      <main className="flex-1 p-6 max-w-[1600px] w-full mx-auto space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-[#DCE5EF] rounded-xl p-6 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#D99614] font-bold block">
              MULTI-TENANT AGENCY PORTFOLIO & CLIENT GOVERNANCE
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B1F3A] mt-1">
              Authorized Client Registry ({clientRegistry.length})
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage verified client locations, GBP store codes, domains, and provider mappings across your authorized tenants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => refreshClients()}
              className="px-4 py-2 bg-[#F4F7FB] hover:bg-slate-200 border border-[#DCE5EF] rounded-lg text-xs font-bold text-[#0B1F3A]"
            >
              Refresh Portfolio
            </button>
            <button
              type="button"
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold text-xs rounded-lg shadow-sm"
            >
              + Add New Client
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white border border-[#DCE5EF] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, address, store code, or domain..."
            className="w-full sm:max-w-md bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-xs text-[#0B1F3A] font-medium focus:outline-none focus:ring-2 focus:ring-[#D99614]"
          />

          <div className="flex items-center gap-2">
            {(['ALL', 'CERTIFIED', 'UNCERTIFIED'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filterMode === mode
                    ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                    : 'bg-[#F4F7FB] text-slate-600 border-[#DCE5EF]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Client Cards Grid */}
        {registryState === 'AUTH_REQUIRED' ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-8 text-center space-y-3">
            <h3 className="text-base font-bold text-amber-900">
              Sign In Required to View Your 9 Authorized Clients
            </h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto">
              Authenticate with your administrator credentials so PorchLight can verify your tenant memberships and load your client portfolio.
            </p>
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-[#0B1F3A] text-white font-bold text-xs rounded-lg"
            >
              Sign In Now →
            </Link>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-48 bg-white border border-[#DCE5EF] rounded-xl p-5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => {
              const isSelected = activeClient?.id === client.id;
              return (
                <div
                  key={client.id}
                  className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                    isSelected
                      ? 'border-2 border-[#D99614] ring-2 ring-[#D99614]/15'
                      : 'border-[#DCE5EF] hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-[10px] px-2.5 py-0.5 rounded border font-bold ${
                          client.is_certified
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {client.is_certified ? '✓ CERTIFIED' : '• SETUP / REVIEW REQUIRED'}
                      </span>
                      {client.store_code && (
                        <span className="font-mono text-[10px] text-slate-500 bg-[#F4F7FB] px-2 py-0.5 rounded border border-[#DCE5EF]">
                          #{client.store_code}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0B1F3A]">{client.name}</h3>
                    <p className="text-xs text-slate-600">
                      {client.address || 'Primary address not configured'}
                    </p>
                    {client.domain && (
                      <p className="text-xs font-mono text-sky-700">{client.domain}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#DCE5EF] flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(client)}
                      className="px-3 py-1.5 bg-[#F4F7FB] hover:bg-slate-200 border border-[#DCE5EF] rounded-lg text-xs font-bold text-[#0B1F3A]"
                    >
                      Edit Details
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveClient(client);
                          router.push(`/connection-center?clientId=${client.id}`);
                        }}
                        className="px-3 py-1.5 bg-[#F4F7FB] hover:bg-slate-200 border border-[#DCE5EF] rounded-lg text-xs font-bold text-[#0B1F3A]"
                      >
                        Map Providers
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveClient(client);
                          router.push(`/command-center?clientId=${client.id}`);
                        }}
                        className="px-3 py-1.5 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] rounded-lg text-xs font-bold"
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0B1F3A]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#DCE5EF] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#DCE5EF] pb-3">
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  {editingClient ? `Edit ${editingClient.name}` : 'Create New Client Account'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#0B1F3A] mb-1">
                    Client Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0B1F3A] mb-1">
                    Primary Street Address
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0B1F3A] mb-1">
                      Website Domain
                    </label>
                    <input
                      type="text"
                      value={formDomain}
                      onChange={(e) => setFormDomain(e.target.value)}
                      placeholder="e.g., example.com"
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#0B1F3A] mb-1">
                      GBP Store Code
                    </label>
                    <input
                      type="text"
                      value={formStoreCode}
                      onChange={(e) => setFormStoreCode(e.target.value)}
                      placeholder="e.g., 1003001"
                      className="w-full bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg px-3.5 py-2 text-sm text-[#0B1F3A] font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#DCE5EF] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-[#F4F7FB] border border-[#DCE5EF] rounded-lg font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#D99614] hover:bg-[#B87D0E] text-[#0B1F3A] font-bold rounded-lg"
                  >
                    {saving ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Clients...</div>}>
      <ClientsPortfolioContent />
    </Suspense>
  );
}
