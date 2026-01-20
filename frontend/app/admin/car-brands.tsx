/**
 * Car Brands Admin - Refactored with TanStack Query + FlashList
 * High-performance, stable architecture with optimistic updates
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../src/hooks/useTheme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { carBrandsApi } from '../../src/services/api';
import { useAdminSync } from '../../src/services/adminSyncService';
import { Header } from '../../src/components/Header';
import { ImageUploader } from '../../src/components/ui/ImageUploader';
import { Toast } from '../../src/components/ui/FormFeedback';
import { queryKeys } from '../../src/lib/queryClient';

// Types
interface CarBrand {
  id: string;
  name: string;
  name_ar: string;
  logo?: string;
}

// Memoized Brand List Item Component
const BrandListItem = React.memo(({
  brand,
  colors,
  onEdit,
  onDelete,
}: {
  brand: CarBrand;
  colors: any;
  onEdit: (brand: CarBrand) => void;
  onDelete: (id: string) => void;
}) => (
  <View style={[styles.listItem, { borderColor: colors.border }]}>
    {brand.logo ? (
      <Image source={{ uri: brand.logo }} style={styles.brandLogo} />
    ) : (
      <View style={[styles.brandLogoPlaceholder, { backgroundColor: colors.surface }]}>
        <Ionicons name="car-sport" size={24} color={colors.textSecondary} />
      </View>
    )}
    <View style={styles.brandInfo}>
      <Text style={[styles.brandName, { color: colors.text }]}>{brand.name}</Text>
      <Text style={[styles.brandNameAr, { color: colors.textSecondary }]}>{brand.name_ar}</Text>
    </View>
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
        onPress={() => onEdit(brand)}
      >
        <Ionicons name="create" size={18} color={colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
        onPress={() => onDelete(brand.id)}
      >
        <Ionicons name="trash" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  </View>
));

export default function CarBrandsAdmin() {
  const { colors } = useTheme();
  const { language, isRTL } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminSync = useAdminSync();

  // Form state
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [logoImage, setLogoImage] = useState<string>('');

  // Edit mode state
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // TanStack Query: Fetch Brands
  const {
    data: brandsData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.carBrands.all,
    queryFn: async () => {
      const response = await carBrandsApi.getAll();
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const brands: CarBrand[] = brandsData || [];

  // Filter brands based on search query
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter((brand) => {
      const brandName = (brand.name || '').toLowerCase();
      const brandNameAr = (brand.name_ar || '').toLowerCase();
      return brandName.includes(query) || brandNameAr.includes(query);
    });
  }, [brands, searchQuery]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminSync.createCarBrand(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.carBrands.all });
        showToast(language === 'ar' ? 'تم إضافة الماركة بنجاح' : 'Brand created successfully', 'success');
        resetForm();
      } else {
        showToast(result.error || 'Failed to create brand', 'error');
      }
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create brand', 'error');
    },
  });

  // Update Mutation (using direct API since adminSync doesn't have update for car brands)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await carBrandsApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carBrands.all });
      showToast(language === 'ar' ? 'تم تحديث الماركة بنجاح' : 'Brand updated successfully', 'success');
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update brand', 'error');
    },
  });

  // Delete Mutation with Optimistic Update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminSync.deleteCarBrand(id);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.carBrands.all });
      const previousBrands = queryClient.getQueryData(queryKeys.carBrands.all);

      queryClient.setQueryData(queryKeys.carBrands.all, (old: CarBrand[] | undefined) =>
        old ? old.filter(b => b.id !== deletedId) : []
      );

      return { previousBrands };
    },
    onSuccess: (result) => {
      if (result.success) {
        showToast(language === 'ar' ? 'تم حذف الماركة بنجاح' : 'Brand deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete brand', 'error');
        queryClient.invalidateQueries({ queryKey: queryKeys.carBrands.all });
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousBrands) {
        queryClient.setQueryData(queryKeys.carBrands.all, context.previousBrands);
      }
      showToast(language === 'ar' ? 'فشل في حذف الماركة' : 'Failed to delete brand', 'error');
    },
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setNameAr('');
    setLogoImage('');
    setIsEditMode(false);
    setEditingBrand(null);
  }, []);

  const handleEditBrand = useCallback((brand: CarBrand) => {
    setName(brand.name || '');
    setNameAr(brand.name_ar || '');
    setLogoImage(brand.logo || '');
    setEditingBrand(brand);
    setIsEditMode(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !nameAr.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال الاسم بالإنجليزية والعربية' : 'Please enter name in both languages', 'error');
      return;
    }

    const brandData = {
      name: name.trim(),
      name_ar: nameAr.trim(),
      logo: logoImage || undefined,
    };

    if (isEditMode && editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, data: brandData });
    } else {
      createMutation.mutate(brandData);
    }
  }, [name, nameAr, logoImage, isEditMode, editingBrand, language, showToast, createMutation, updateMutation]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // List Header Component
  const ListHeaderComponent = useCallback(() => (
    <View>
      {/* Breadcrumb */}
      <View style={[styles.breadcrumb, isRTL && styles.breadcrumbRTL]}>
        <TouchableOpacity onPress={() => router.push('/admin')}>
          <Text style={[styles.breadcrumbText, { color: colors.primary }]}>
            {language === 'ar' ? 'لوحة التحكم' : 'Admin'}
          </Text>
        </TouchableOpacity>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textSecondary} />
        <Text style={[styles.breadcrumbText, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'ماركات السيارات' : 'Car Brands'}
        </Text>
      </View>

      {/* Add/Edit Form */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: isEditMode ? colors.primary : colors.border }]}>
        <View style={styles.formTitleRow}>
          <Text style={[styles.formTitle, { color: isEditMode ? colors.primary : colors.text }]}>
            {isEditMode 
              ? (language === 'ar' ? 'تعديل الماركة' : 'Edit Brand')
              : (language === 'ar' ? 'إضافة ماركة جديدة' : 'Add New Brand')
            }
          </Text>
          {isEditMode && (
            <TouchableOpacity
              style={[styles.cancelEditBtn, { backgroundColor: colors.error + '20' }]}
              onPress={resetForm}
            >
              <Ionicons name="close" size={18} color={colors.error} />
              <Text style={[styles.cancelEditText, { color: colors.error }]}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logo Upload Section */}
        <View style={styles.formGroup}>
          <ImageUploader
            mode="single"
            value={logoImage}
            onChange={(newImage) => setLogoImage(newImage as string)}
            size="medium"
            shape="circle"
            label={language === 'ar' ? 'شعار الماركة' : 'Brand Logo'}
            hint={language === 'ar' ? 'اختر صورة الشعار' : 'Choose logo image'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'ar' ? 'الاسم (بالإنجليزية) *' : 'Name (English) *'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder={language === 'ar' ? 'مثال: Toyota' : 'e.g., Toyota'}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'ar' ? 'الاسم (بالعربية) *' : 'Name (Arabic) *'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }, isRTL && styles.inputRTL]}
            value={nameAr}
            onChangeText={setNameAr}
            placeholder={language === 'ar' ? 'مثال: تويوتا' : 'e.g., تويوتا'}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name={isEditMode ? "create" : "save"} size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>
                {isEditMode 
                  ? (language === 'ar' ? 'تحديث' : 'Update')
                  : (language === 'ar' ? 'حفظ' : 'Save')
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* List Header */}
      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.listTitle, { color: colors.text }]}>
          {language === 'ar' ? 'الماركات الحالية' : 'Existing Brands'} ({filteredBrands.length})
        </Text>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={language === 'ar' ? 'ابحث بالاسم...' : 'Search by name...'}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  ), [isRTL, colors, language, isEditMode, logoImage, name, nameAr, isSaving, filteredBrands.length, searchQuery, router, resetForm, handleSave]);

  // Empty component
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found') : (language === 'ar' ? 'لا توجد ماركات' : 'No brands found')}
        </Text>
      )}
    </View>
  ), [isLoading, colors, searchQuery, language]);

  // Render item
  const renderItem = useCallback(({ item }: { item: CarBrand }) => (
    <BrandListItem
      brand={item}
      colors={colors}
      onEdit={handleEditBrand}
      onDelete={handleDelete}
    />
  ), [colors, handleEditBrand, handleDelete]);

  const keyExtractor = useCallback((item: CarBrand) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Header title={language === 'ar' ? 'ماركات السيارات' : 'Car Brands'} showBack showSearch={false} showCart={false} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlashList
          data={filteredBrands}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={72}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.listContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          extraData={[colors, language, searchQuery]}
        />
      </KeyboardAvoidingView>
      
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onDismiss={() => setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  listContentContainer: { padding: 16 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  breadcrumbRTL: { flexDirection: 'row-reverse' },
  breadcrumbText: { fontSize: 14 },
  formCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  formTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  formTitle: { fontSize: 18, fontWeight: '700' },
  cancelEditBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  cancelEditText: { fontSize: 14, fontWeight: '600' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  inputRTL: { textAlign: 'right' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 8, gap: 8 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  listCard: { borderRadius: 12, borderWidth: 1, padding: 16 },
  listTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyText: { textAlign: 'center', fontSize: 15 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  brandLogo: { width: 48, height: 48, borderRadius: 8 },
  brandLogoPlaceholder: { width: 48, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandInfo: { flex: 1, marginLeft: 12 },
  brandName: { fontSize: 16, fontWeight: '600' },
  brandNameAr: { fontSize: 14, marginTop: 2 },
  actionButtons: { flexDirection: 'column', gap: 8 },
  editButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
