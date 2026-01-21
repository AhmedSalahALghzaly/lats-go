/**
 * FavoritesTab - Favorites list display tab
 * FIXED: FlashList now handles scrolling as primary scroll container
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EmptyState } from '../ui/EmptyState';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { NEON_NIGHT_THEME } from '../../store/appStore';

interface FavoritesTabProps {
  favorites: any[];
  isRTL: boolean;
  isAdminView: boolean;
  onAddToCart: (product: any) => void;
  onToggleFavorite: (productId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
  favorites,
  isRTL,
  isAdminView,
  onAddToCart,
  onToggleFavorite,
  onRefresh,
  refreshing = false,
}) => {
  const { colors } = useTheme();
  const { language } = useTranslation();
  const router = useRouter();

  const safeFavorites = Array.isArray(favorites) ? favorites : [];

  // Render favorite item for FlashList
  const renderFavoriteItem = useCallback(({ item }: { item: any }) => (
    <Pressable
      style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${item.product_id || item.product?.id}`)}
    >
      <View style={[styles.productThumb, { backgroundColor: colors.surface }]}>
        {item.product?.image_url ? (
          <Image source={{ uri: item.product.image_url }} style={styles.productImage} />
        ) : (
          <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
          {language === 'ar' ? item.product?.name_ar : item.product?.name}
        </Text>
        <Text style={[styles.productPrice, { color: NEON_NIGHT_THEME.primary }]}>
          {item.product?.price?.toFixed(0)} ج.م
        </Text>
      </View>

      <View style={styles.productActions}>
        <Pressable
          style={[styles.iconActionBtn, { backgroundColor: NEON_NIGHT_THEME.primary }]}
          onPress={() => onAddToCart(item.product)}
        >
          <Ionicons name="cart-outline" size={16} color="#FFF" />
        </Pressable>
        {!isAdminView && (
          <Pressable
            style={[styles.iconActionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => onToggleFavorite(item.product_id || item.product?.id)}
          >
            <Ionicons name="heart-dislike-outline" size={16} color="#FFF" />
          </Pressable>
        )}
      </View>
    </Pressable>
  ), [colors, language, router, isAdminView, onAddToCart, onToggleFavorite]);

  // List header with section title
  const ListHeaderComponent = useCallback(() => (
    <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {language === 'ar' ? 'المنتجات المفضلة' : 'Favorite Products'}
      </Text>
      <View style={[styles.countBadge, { backgroundColor: NEON_NIGHT_THEME.primary }]}>
        <Text style={styles.countBadgeText}>{safeFavorites.length}</Text>
      </View>
    </View>
  ), [colors, language, isRTL, safeFavorites.length]);

  // List footer
  const ListFooterComponent = useCallback(() => (
    <View style={{ height: 100 }} />
  ), []);

  // Empty state
  const ListEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <EmptyState
        icon="heart-outline"
        title={language === 'ar' ? 'لا توجد منتجات مفضلة' : 'No favorites yet'}
      />
    </View>
  ), [language, colors]);

  return (
    <FlashList
      data={safeFavorites}
      renderItem={renderFavoriteItem}
      keyExtractor={(item, index) => item.product_id || item.id || `fav-item-${index}`}
      estimatedItemSize={70}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={NEON_NIGHT_THEME.primary}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 44,
    height: 44,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  productActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesTab;
