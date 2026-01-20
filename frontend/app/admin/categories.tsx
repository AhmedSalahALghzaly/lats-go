/**
 * Categories Admin - Refactored with TanStack Query + FlashList
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
import { categoriesApi } from '../../src/services/api';
import { useAdminSync } from '../../src/services/adminSyncService';
import { Header } from '../../src/components/Header';
import { ImageUploader } from '../../src/components/ui/ImageUploader';
import { Toast } from '../../src/components/ui/FormFeedback';
import { queryKeys } from '../../src/lib/queryClient';

// Types
interface Category {
  id: string;
  name: string;
  name_ar: string;
  parent_id?: string | null;
  icon?: string;
  image_data?: string;
}

// Memoized Category List Item Component
const CategoryListItem = React.memo(({
  category,
  parentName,
  colors,
  onEdit,
  onDelete,
}: {
  category: Category;
  parentName: string;
  colors: any;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) => {
  const hasImage = category.image_data && category.image_data.length > 0;
  return (
    <View style={[styles.listItem, { borderColor: colors.border }]}>
      <View style={[styles.categoryIcon, { backgroundColor: hasImage ? 'transparent' : colors.primary + '20', overflow: 'hidden' }]}>
        {hasImage ? (
          <Image source={{ uri: category.image_data }} style={styles.categoryImage} resizeMode="cover" />
        ) : (
          <Ionicons name={(category.icon || 'grid') as any} size={24} color={colors.primary} />
        )}
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
        <Text style={[styles.categoryMeta, { color: colors.textSecondary }]}>
          {category.name_ar} {parentName ? `• ${parentName}` : ''}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => onEdit(category)}
        >
          <Ionicons name="create" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
          onPress={() => onDelete(category.id)}
        >
          <Ionicons name="trash" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default function CategoriesAdmin() {
  const { colors } = useTheme();
  const { language, isRTL } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminSync = useAdminSync();

  // Form state
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [icon, setIcon] = useState('');
  const [categoryImage, setCategoryImage] = useState<string>('');

  // Edit mode state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // TanStack Query: Fetch Categories
  const {
    data: categoriesData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const response = await categoriesApi.getAll();
      return response.data || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const categories: Category[] = categoriesData || [];

  // Parent categories (those without parent_id)
  const parentCategories = useMemo(() => 
    categories.filter(c => !c.parent_id),
  [categories]);

  // Pre-compute parent name map
  const parentNameMap = useMemo(() => {
    const map: Record<string, { name: string; name_ar: string }> = {};
    categories.forEach(cat => {
      map[cat.id] = { name: cat.name, name_ar: cat.name_ar };
    });
    return map;
  }, [categories]);

  const getParentName = useCallback((parentId: string | null | undefined) => {
    if (!parentId) return '';
    const parent = parentNameMap[parentId];
    return parent ? (language === 'ar' ? parent.name_ar : parent.name) : '';
  }, [parentNameMap, language]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const query = searchQuery.toLowerCase();
    return categories.filter((category) => {
      const catName = (category.name || '').toLowerCase();
      const catNameAr = (category.name_ar || '').toLowerCase();
      return catName.includes(query) || catNameAr.includes(query);
    });
  }, [categories, searchQuery]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return adminSync.createCategory(data);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        showToast(language === 'ar' ? 'تم حفظ الفئة بنجاح' : 'Category saved successfully', 'success');
        resetForm();
      } else {
        showToast(result.error || 'Error saving category', 'error');
      }
    },
    onError: (error: any) => {
      showToast(error.message || 'Error saving category', 'error');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return adminSync.updateCategory(id, data);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
        showToast(language === 'ar' ? 'تم تحديث الفئة بنجاح' : 'Category updated successfully', 'success');
        resetForm();
      } else {
        showToast(result.error || 'Failed to update category', 'error');
      }
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update category', 'error');
    },
  });

  // Delete Mutation with Optimistic Update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminSync.deleteCategory(id);
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previousCategories = queryClient.getQueryData(queryKeys.categories.all);

      queryClient.setQueryData(queryKeys.categories.all, (old: Category[] | undefined) =>
        old ? old.filter(c => c.id !== deletedId) : []
      );

      return { previousCategories };
    },
    onSuccess: (result) => {
      if (result.success) {
        showToast(language === 'ar' ? 'تم حذف الفئة بنجاح' : 'Category deleted successfully', 'success');
      } else {
        showToast(result.error || 'Failed to delete category', 'error');
        queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(queryKeys.categories.all, context.previousCategories);
      }
      showToast(language === 'ar' ? 'فشل في حذف الفئة' : 'Failed to delete category', 'error');
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
    setParentId(null);
    setIcon('');
    setCategoryImage('');
    setIsEditMode(false);
    setEditingCategory(null);
  }, []);

  const handleEditCategory = useCallback((category: Category) => {
    setName(category.name || '');
    setNameAr(category.name_ar || '');
    setParentId(category.parent_id || null);
    setIcon(category.icon || '');
    setCategoryImage(category.image_data || '');
    setEditingCategory(category);
    setIsEditMode(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim() || !nameAr.trim()) {
      showToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields', 'error');
      return;
    }

    const categoryData = {
      name: name.trim(),
      name_ar: nameAr.trim(),
      parent_id: parentId,
      icon: icon.trim() || null,
      image_data: categoryImage || null,
    };

    if (isEditMode && editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: categoryData });
    } else {
      createMutation.mutate(categoryData);
    }
  }, [name, nameAr, parentId, icon, categoryImage, isEditMode, editingCategory, language, showToast, createMutation, updateMutation]);

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
          {language === 'ar' ? 'الفئات' : 'Categories'}
        </Text>
      </View>

      {/* Add/Edit Form */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: isEditMode ? colors.primary : colors.border }]}>
        <View style={styles.formTitleRow}>
          <Text style={[styles.formTitle, { color: isEditMode ? colors.primary : colors.text }]}>
            {isEditMode 
              ? (language === 'ar' ? 'تعديل الفئة' : 'Edit Category')
              : (language === 'ar' ? 'إضافة فئة جديدة' : 'Add New Category')
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

        {/* Parent Category Selector */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'ar' ? 'الفئة الرئيسية (اختياري)' : 'Parent Category (Optional)'}
          </Text>
          <View style={styles.parentSelectorWrapper}>
            <TouchableOpacity
              style={[
                styles.parentChip,
                { backgroundColor: !parentId ? colors.primary : colors.surface, borderColor: colors.border }
              ]}
              onPress={() => setParentId(null)}
            >
              <Text style={{ color: !parentId ? '#FFF' : colors.text }}>
                {language === 'ar' ? 'بدون فئة رئيسية' : 'No Parent'}
              </Text>
            </TouchableOpacity>
            {parentCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.parentChip,
                  { backgroundColor: parentId === cat.id ? colors.primary : colors.surface, borderColor: colors.border }
                ]}
                onPress={() => setParentId(cat.id)}
              >
                <Text style={{ color: parentId === cat.id ? '#FFF' : colors.text }}>
                  {language === 'ar' ? cat.name_ar : cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'ar' ? 'الاسم (بالإنجليزية) *' : 'Name (English) *'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={name}
            onChangeText={setName}
            placeholder={language === 'ar' ? 'مثال: Engine' : 'e.g., Engine'}
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
            placeholder={language === 'ar' ? 'مثال: المحرك' : 'e.g., المحرك'}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            {language === 'ar' ? 'الأيقونة (اختياري)' : 'Icon Name (Optional)'}
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={icon}
            onChangeText={setIcon}
            placeholder="e.g., settings"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Category Image Upload */}
        <View style={styles.formGroup}>
          <ImageUploader
            mode="single"
            value={categoryImage}
            onChange={(newImage) => setCategoryImage(newImage as string)}
            size="medium"
            shape="rounded"
            label={language === 'ar' ? 'صورة الفئة' : 'Category Image'}
            hint={language === 'ar' ? 'اختر صورة للفئة (اختياري)' : 'Choose a category image (optional)'}
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
          {language === 'ar' ? 'الفئات الحالية' : 'Existing Categories'} ({filteredCategories.length})
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
  ), [isRTL, colors, language, isEditMode, parentId, parentCategories, name, nameAr, icon, categoryImage, isSaving, filteredCategories.length, searchQuery, router, resetForm, handleSave]);

  // Empty component
  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found') : (language === 'ar' ? 'لا توجد فئات' : 'No categories found')}
        </Text>
      )}
    </View>
  ), [isLoading, colors, searchQuery, language]);

  // Render item
  const renderItem = useCallback(({ item }: { item: Category }) => (
    <CategoryListItem
      category={item}
      parentName={getParentName(item.parent_id)}
      colors={colors}
      onEdit={handleEditCategory}
      onDelete={handleDelete}
    />
  ), [colors, getParentName, handleEditCategory, handleDelete]);

  const keyExtractor = useCallback((item: Category) => item.id, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Header title={language === 'ar' ? 'الفئات' : 'Categories'} showBack showSearch={false} showCart={false} />

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlashList
          data={filteredCategories}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={80}
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
  parentSelectorWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  parentChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
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
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  categoryIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryImage: { width: 52, height: 52, borderRadius: 12 },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryMeta: { fontSize: 13, marginTop: 2 },
  actionButtons: { flexDirection: 'column', gap: 8 },
  editButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
