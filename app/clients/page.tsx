'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useClient, ClientProfile } from '../../lib/client-context';
import GlobalHeader from '../../components/navigation/GlobalHeader';

export const dynamic = 'force-dynamic';

function ClientPortfolioContent() {
  const router = useRouter();
  const { activeClient, setActiveClient, clientRegistry, isLoading, refreshClients } = useClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CERTIFIED' | 'UNMAPPED'>('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newZips, setNewZips] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editZips, setEditZips] = useState('');

  const filteredClients = clientRegistry.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.service_areas || []).some((z) => z.includes(searchQuery));

    if (!matchesSearch) return false;
    if (statusFilter === 'CERTIFIED') return client.is_certified;
    if (statusFilter === 'UNMAPPED') return !client.is_certified;
    return true;
  });

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const zipsArray = newZips
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean);

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim(),
          service_areas: zipsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data?.error?.message || 'Failed to create client.');
        setSubmitting(false);
        return;
      }

      await refreshClients();
      setActiveClient(data.client);
      setShowAddModal(false);
      setNewName('');
      setNewAddress('');
      setNewZips('');
    } catch (err: any) {
      setFormError(err?.message || 'Unexpected error creating client.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDrawer = (client: ClientProfile) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditAddress(client.address || '');
    setEditZips((client.service_areas || []).join(', '));
    setFormError(null);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setFormError(null);
    setSubmitting(true);

    try {
      const zipsArray = editZips
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean);

      const res = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          address: editAddress.trim(),
          service_areas: zipsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data?.error?.message || 'Failed to update client.');
        setSubmitting(false);
        return;
      }

      await refreshClients();
      if (activeClient?.id === editingClient.id) {
        setActiveClient(data.client);
      }
      setEditingClient(null);
    } catch (err: any) {
      setFormError(err?.message || 'Unexpected error updating client.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectAndNavigate = (client: ClientProfile, destination: string) => {
    setActiveClient(client);
    router.push(`${destination}?clientId=${client.id}`);
  };

  return (
    <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6 text-white font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111622] border border-[#A9C7E5]/15 rounded-xl p-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#D99614] font-semibold block">
            AGENCY PORTFOLIO • AUTHORITATIVE CLIENT REGISTRY
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Client Portfolio</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage client profiles, service geographies, provider resource mappings, and data certification status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refreshClients()}
            className="px-3.5 py-2 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/15 rounded-lg text-xs font-medium text-slate-200 transition-all"
          >
            Refresh Registry
          </button>
          <button
            onClick={() => {
              setFormError(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold text-xs rounded-lg transition-all shadow"
          >
            + Add New Client
          </button>
        </div>
      </div>

      <div className="bg-[#111622] border border-[#A9C7E5]/10 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients by name, address, or ZIP code..."
          className="w-full sm:max-w-md bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
        />

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium border ${
              statusFilter === 'ALL'
                ? 'bg-[#D99614]/15 text-[#D99614] border-[#D99614]/30'
                : 'bg-[#151D2A] text-slate-400 border-[#A9C7E5]/10'
            }`}
          >
            All ({clientRegistry.length})
          </button>
          <button
            onClick={() => setStatusFilter('CERTIFIED')}
            className={`px-3 py-1.5 rounded-lg font-medium border ${
              statusFilter === 'CERTIFIED'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-[#151D2A] text-slate-400 border-[#A9C7E5]/10'
            }`}
          >
            Certified ({clientRegistry.filter((c) => c.is_certified).length})
          </button>
          <button
            onClick={() => setStatusFilter('UNMAPPED')}
            className={`px-3 py-1.5 rounded-lg font-medium border ${
              statusFilter === 'UNMAPPED'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                : 'bg-[#151D2A] text-slate-400 border-[#A9C7E5]/10'
            }`}
          >
            Unmapped ({clientRegistry.filter((c) => !c.is_certified).length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center text-sm text-slate-400">
          Loading authorized client registry from Supabase...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#111622] border border-[#A9C7E5]/10 text-center space-y-3">
          <h3 className="text-base font-bold text-white">No Matching Client Profiles</h3>
          <p className="text-xs text-slate-400">
            Create a new client profile or adjust your search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const isSelected = activeClient?.id === client.id;
            const mappedCount =
              client.mapped_resource_count ??
              Object.values(client.mappings || {}).filter(Boolean).length;

            return (
              <div
                key={client.id}
                className={`bg-[#111622] rounded-xl p-5 flex flex-col justify-between space-y-4 border transition-all ${
                  isSelected
                    ? 'border-[#D99614] shadow-lg shadow-[#D99614]/5'
                    : 'border-[#A9C7E5]/12 hover:border-[#A9C7E5]/25'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{client.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {client.address || 'No physical address configured'}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2.5 py-0.5 rounded border font-semibold shrink-0 ${
                        client.is_certified
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                      }`}
                    >
                      {client.is_certified ? 'CERTIFIED' : 'UNMAPPED'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#A9C7E5]/10 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Mapped Providers</span>
                      <span className="text-slate-200 font-mono font-semibold">
                        {mappedCount} {mappedCount === 1 ? 'Resource' : 'Resources'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Service Areas</span>
                      <span className="text-slate-200 font-mono font-semibold">
                        {client.service_areas?.length > 0
                          ? `${client.service_areas.slice(0, 3).join(', ')}${
                              client.service_areas.length > 3 ? '...' : ''
                            }`
                          : 'Not Configured'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#A9C7E5]/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openEditDrawer(client)}
                    className="px-3 py-1.5 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/15 rounded-lg text-xs text-slate-300 font-medium"
                  >
                    Edit Details
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => selectAndNavigate(client, '/connection-center')}
                      className="px-3 py-1.5 bg-[#151D2A] hover:bg-[#1C273A] border border-[#A9C7E5]/20 rounded-lg text-xs text-slate-200 font-medium"
                    >
                      Map Providers
                    </button>
                    <button
                      onClick={() => selectAndNavigate(client, '/command-center')}
                      className="px-3 py-1.5 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] rounded-lg text-xs font-semibold"
                    >
                      Command Center →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111622] border border-[#A9C7E5]/20 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
              <h3 className="text-base font-bold text-white">Create New Client Profile</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Business / Client Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Kelly Hyundai of Stroudsburg"
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Primary Location Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g., 1534 N 9th St, Stroudsburg, PA 18360"
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Target Service Area ZIPs (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newZips}
                  onChange={(e) => setNewZips(e.target.value)}
                  placeholder="e.g., 18360, 18301, 18302"
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#151D2A] text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold rounded-lg text-xs"
                >
                  {submitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#111622] border border-[#A9C7E5]/20 rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#A9C7E5]/10 pb-3">
              <h3 className="text-base font-bold text-white">Edit Client Profile</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Business / Client Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Primary Location Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Target Service Area ZIPs (Comma-separated)
                </label>
                <input
                  type="text"
                  value={editZips}
                  onChange={(e) => setEditZips(e.target.value)}
                  className="w-full bg-[#151D2A] border border-[#A9C7E5]/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D99614]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-[#151D2A] text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#D99614] hover:bg-[#B97A08] text-[#0B0F17] font-semibold rounded-lg text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ClientsPortfolioPage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col font-sans">
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Header...</div>}>
        <GlobalHeader />
      </Suspense>
      <Suspense fallback={<div className="p-6 text-xs text-slate-400">Loading Client Portfolio...</div>}>
        <ClientPortfolioContent />
      </Suspense>
    </div>
  );
}
