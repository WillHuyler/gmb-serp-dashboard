'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ClientType = 'REAL' | 'TEST' | 'INACTIVE';

export interface ClientRecord {
  id: string;
  tenant_id: string;
  name: string;
  domain?: string;
  is_certified?: boolean;
  type?: ClientType;
  mappings?: Record<string, any>;
}

interface ClientContextType {
  activeClient: ClientRecord | null;
  clients: ClientRecord[];
  availableClients: ClientRecord[];
  setActiveClient: (client: ClientRecord) => void;
  setActiveClientId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ClientContext = createContext<ClientContextType>({
  activeClient: null,
  clients: [],
  availableClients: [],
  setActiveClient: () => {},
  setActiveClientId: () => {},
  isLoading: true,
  error: null,
});

export function ClientProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [activeClient, setActiveClientState] = useState<ClientRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClients() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/clients');
        const data = await res.json();

        if (data.success && Array.isArray(data.clients) && data.clients.length > 0) {
          setClients(data.clients);

          const urlClientId =
            searchParams?.get('clientId') ||
            (typeof window !== 'undefined' ? localStorage.getItem('porchlight_active_client_id') : null);

          const matched = data.clients.find((c: ClientRecord) => c.id === urlClientId);
          if (matched) {
            setActiveClientState(matched);
          } else {
            setActiveClientState(data.clients[0]);
          }
        } else {
          // Fallback direct query via Supabase JS client
          const { data: dbClients, error: dbError } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true });

          if (dbError) throw dbError;

          if (dbClients && dbClients.length > 0) {
            setClients(dbClients);
            setActiveClientState(dbClients[0]);
          }
        }
      } catch (err: any) {
        console.error('Failed to load clients in ClientProvider:', err);
        setError(err.message || 'Failed to initialize client context');
      } finally {
        setIsLoading(false);
      }
    }

    loadClients();
  }, [searchParams]);

  const setActiveClient = (client: ClientRecord) => {
    setActiveClientState(client);
    if (typeof window !== 'undefined') {
      localStorage.setItem('porchlight_active_client_id', client.id);
    }
  };

  const setActiveClientId = (id: string) => {
    const match = clients.find((c) => c.id === id);
    if (match) {
      setActiveClient(match);
    }
  };

  return (
    <ClientContext.Provider
      value={{
        activeClient,
        clients,
        availableClients: clients,
        setActiveClient,
        setActiveClientId,
        isLoading,
        error,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}
