/**
 * Home Screen Query Hook with React Query
 * Provides data fetching for the home screen with caching and parallel loading
 */
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import {
  categoriesApi,
  carBrandsApi,
  carModelsApi,
  productBrandsApi,
  productsApi,
  favoritesApi,
  promotionApi,
  partnerApi,
} from '../../services/api';
import { useAppStore } from '../../store/appStore';

// Query keys for home screen
export const homeScreenKeys = {
  all: ['homeScreen'] as const,
  categories: ['homeScreen', 'categories'] as const,
  carBrands: ['homeScreen', 'carBrands'] as const,
  carModels: ['homeScreen', 'carModels'] as const,
  productBrands: ['homeScreen', 'productBrands'] as const,
  products: ['homeScreen', 'products'] as const,
  favorites: ['homeScreen', 'favorites'] as const,
  banners: ['homeScreen', 'banners'] as const,
  partners: ['homeScreen', 'partners'] as const,
};

/**
 * Hook to fetch all home screen data in parallel
 */
export function useHomeScreenQuery() {
  const user = useAppStore((state) => state.user);
  const setGlobalCategories = useAppStore((state) => state.setCategories);
  const setGlobalCarBrands = useAppStore((state) => state.setCarBrands);
  const setGlobalCarModels = useAppStore((state) => state.setCarModels);
  const setGlobalProductBrands = useAppStore((state) => state.setProductBrands);
  const setGlobalProducts = useAppStore((state) => state.setProducts);
  const setGlobalPartners = useAppStore((state) => state.setPartners);

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: homeScreenKeys.categories,
    queryFn: async () => {
      const response = await categoriesApi.getTree();
      const data = response.data || [];
      setGlobalCategories(data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Car Brands query
  const carBrandsQuery = useQuery({
    queryKey: homeScreenKeys.carBrands,
    queryFn: async () => {
      const response = await carBrandsApi.getAll();
      const data = response.data || [];
      setGlobalCarBrands(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Car Models query
  const carModelsQuery = useQuery({
    queryKey: homeScreenKeys.carModels,
    queryFn: async () => {
      const response = await carModelsApi.getAll();
      const data = response.data || [];
      setGlobalCarModels(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Product Brands query
  const productBrandsQuery = useQuery({
    queryKey: homeScreenKeys.productBrands,
    queryFn: async () => {
      const response = await productBrandsApi.getAll();
      const data = response.data || [];
      setGlobalProductBrands(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Products query
  const productsQuery = useQuery({
    queryKey: homeScreenKeys.products,
    queryFn: async () => {
      const response = await productsApi.getAll({ limit: 100 });
      const data = response.data?.products || [];
      setGlobalProducts(data);
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for products
  });

  // Partners query
  const partnersQuery = useQuery({
    queryKey: homeScreenKeys.partners,
    queryFn: async () => {
      const response = await partnerApi.getAll();
      const data = response.data || [];
      setGlobalPartners(data);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Favorites query (only when logged in)
  const favoritesQuery = useQuery({
    queryKey: homeScreenKeys.favorites,
    queryFn: async () => {
      if (!user) return new Set<string>();
      const response = await favoritesApi.getAll();
      const favIds = new Set<string>(
        (response.data?.favorites || []).map((f: any) => f.product_id)
      );
      return favIds;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Banners query
  const bannersQuery = useQuery({
    queryKey: homeScreenKeys.banners,
    queryFn: async () => {
      const response = await promotionApi.getAll();
      return (response.data || []).filter(
        (p: any) => p.promotion_type === 'banner' && p.is_active
      );
    },
    staleTime: 2 * 60 * 1000,
  });

  // Check if any essential query is loading
  const isLoading =
    categoriesQuery.isLoading ||
    carBrandsQuery.isLoading ||
    carModelsQuery.isLoading ||
    productBrandsQuery.isLoading ||
    productsQuery.isLoading;

  const isRefetching =
    categoriesQuery.isRefetching ||
    carBrandsQuery.isRefetching ||
    carModelsQuery.isRefetching ||
    productBrandsQuery.isRefetching ||
    productsQuery.isRefetching;

  // Refetch all data
  const refetch = useCallback(async () => {
    await Promise.all([
      categoriesQuery.refetch(),
      carBrandsQuery.refetch(),
      carModelsQuery.refetch(),
      productBrandsQuery.refetch(),
      productsQuery.refetch(),
      partnersQuery.refetch(),
      favoritesQuery.refetch(),
      bannersQuery.refetch(),
    ]);
  }, [
    categoriesQuery,
    carBrandsQuery,
    carModelsQuery,
    productBrandsQuery,
    productsQuery,
    partnersQuery,
    favoritesQuery,
    bannersQuery,
  ]);

  return {
    categories: categoriesQuery.data || [],
    carBrands: carBrandsQuery.data || [],
    carModels: carModelsQuery.data || [],
    productBrands: productBrandsQuery.data || [],
    products: productsQuery.data || [],
    favorites: favoritesQuery.data || new Set<string>(),
    banners: bannersQuery.data || [],
    isLoading,
    isRefetching,
    refetch,
  };
}

/**
 * Hook to fetch categories tree with caching
 */
export function useCategoriesTreeQuery() {
  return useQuery({
    queryKey: homeScreenKeys.categories,
    queryFn: async () => {
      const response = await categoriesApi.getTree();
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default useHomeScreenQuery;
