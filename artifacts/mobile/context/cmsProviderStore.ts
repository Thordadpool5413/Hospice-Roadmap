import type { Provider } from "@/types";

let cmsProviderMap: Map<string, Provider> = new Map();

export function setCmsProviders(providers: Provider[]) {
  providers.forEach((p) => {
    cmsProviderMap.set(p.id, p);
  });
}

export function getCmsProvider(id: string): Provider | undefined {
  return cmsProviderMap.get(id);
}

export function clearCmsProviders() {
  cmsProviderMap.clear();
}
