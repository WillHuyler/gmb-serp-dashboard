'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  domain?: string;
  is_certified?: boolean;
}

interface ClientContextType {
  activeClient: Client | null;
  clients: Client[];
  setActiveClient: (client: Client) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType>({
  activeClient: null,
  clients: [],
  setActiveClient: () => {},
  isLoading: true,
});

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch('/api/clients');
        const data = await res.json();
        
        if (data.success && data.clients.length > 0) {
          const clientList: Client[] = data.clients;
          setClients(clientList);

          // Parse URL search params to lock onto active client
          const params = new URLSearchParams(window.location.search);
          const urlClientId = params.get('clientId');

          const matchedClient = clientList.find((c) => c.id === urlClientId);
          if (matchedClient) {
            setActiveClient(matchedClient);
          } else {
            setActiveClient(clientList[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadClients();
  }, []);

  return (
    <ClientContext.Provider value={{ activeClient, clients, setActiveClient, isLoading }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => useContext(ClientContext);
