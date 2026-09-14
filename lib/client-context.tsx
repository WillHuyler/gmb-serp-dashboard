'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  domain?: string;
  is_certified: boolean;
}

interface ClientContextType {
  activeClient: Client | null;
  clients: Client[];
  setActiveClient: (client: Client) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        if (data.success && data.clients.length > 0) {
          setClients(data.clients);
          setActiveClient(data.clients[0]);
        }
      } catch (err) {
        console.error('Failed to load active clients:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClients();
  }, []);

  return (
    <ClientContext.Provider value={{ activeClient, clients, setActiveClient, isLoading }}>
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
