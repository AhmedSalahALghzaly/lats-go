/**
 * CartTab - Shopping cart display and management tab
 * FIXED: FlashList now handles scrolling, compact card design
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

const SHIPPING_COST = 150;

interface CartTabProps {
  cartItems: any[];
  isRTL: boolean;
  getSubtotal: () => number;
  getOriginalTotal: () => number;
  getTotalSavings: () => number;
  getItemCount: () => number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const CartTab: React.FC<CartTabProps> = ({
  cartItems,
  isRTL,
  getSubtotal,
  getOriginalTotal,
  getTotalSavings,
  getItemCount,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onRefresh,
  refreshing = false,
}) => {
  const { colors } = useTheme();
  const { language } = useTranslation();
  const router = useRouter();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  // Render compact cart item
  const renderCartItem = useCallback(({ item }: { item: any }) => {
    const originalPrice = item.original_unit_price || item.product?.price || 0;
    const finalPrice = item.final_unit_price || item.product?.price || 0;
    const hasDiscount = originalPrice > finalPrice;
    const lineTotal = finalPrice * item.quantity;

    return (
      <View style={[styles.cartItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          style={[styles.productThumb, { backgroundColor: colors.surface }]}
          onPress={() => router.push(`/product/${item.product_id}`)}
        >
          {item.product?.image_url ? (
            <Image source={{ uri: item.product.image_url }} style={styles.productImage} />
          ) : (
            <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
          )}
          {item.bundle_group_id && (
            <View style={[styles.bundleBadge, { backgroundColor: NEON_NIGHT_THEME.accent }]}>
              <Ionicons name="gift" size={8} color="#FFF" />
            </View>
          )}
        </Pressable>

        <View style={styles.cartItemInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
            {language === 'ar' ? item.product?.name_ar : item.product?.name}
          </Text>

          <View style={[styles.priceRow, isRTL && styles.rowReverse]}>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                {originalPrice.toFixed(0)}
              </Text>
            )}
            <Text style={[styles.finalPrice, { color: NEON_NIGHT_THEME.primary }]}>
              {finalPrice.toFixed(0)} ج.م
            </Text>
          </View>
        </View>

        <View style={styles.quantitySection}>
          <View style={[styles.quantityControls, { borderColor: colors.border }]}>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            >
              <Ionicons name="remove" size={14} color={colors.text} />
            </Pressable>
            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
            <Pressable
              style={styles.qtyBtn}
              onPress={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            >
              <Ionicons name="add" size={14} color={colors.text} />
            </Pressable>
          </View>
          <Pressable
            style={[styles.removeBtn, { borderColor: '#EF4444' }]}
            onPress={() => onRemove(item.product_id)}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    );
  }, [colors, language, isRTL, router, onUpdateQuantity, onRemove]);

  // Order Summary Component
  const OrderSummary = useCallback(() => (
    <View style={[styles.summaryContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {language === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
      </Text>

      {getTotalSavings() > 0 && (
        <View style={[styles.summaryRow, isRTL && styles.rowReverse]}>
          <View style={[styles.savingsRow, isRTL && styles.rowReverse]}>
            <Ionicons name="sparkles" size={14} color="#10B981" />
            <Text style={[styles.savingsLabel, { color: '#10B981' }]}>
              {language === 'ar' ? 'التوفير' : 'You Save'}
            </Text>
          </View>
          <Text style={[styles.savingsValue, { color: '#10B981' }]}>
            -{getTotalSavings().toFixed(0)} ج.م
          </Text>
        </View>
      )}

      <View style={[styles.summaryRow, isRTL && styles.rowReverse]}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {getSubtotal().toFixed(0)} ج.م
        </Text>
      </View>

      <View style={[styles.summaryRow, isRTL && styles.rowReverse]}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'الشحن' : 'Shipping'}
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {SHIPPING_COST.toFixed(0)} ج.م
        </Text>
      </View>

      <View style={[styles.totalRow, { borderTopColor: colors.border }, isRTL && styles.rowReverse]}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>
          {language === 'ar' ? 'الإجمالي' : 'Total'}
        </Text>
        <Text style={[styles.totalValue, { color: NEON_NIGHT_THEME.primary }]}>
          {(getSubtotal() + SHIPPING_COST).toFixed(0)} ج.م
        </Text>
      </View>

      <Pressable
        style={[styles.checkoutBtn, { backgroundColor: NEON_NIGHT_THEME.primary }]}
        onPress={onCheckout}
      >
        <Ionicons name="card-outline" size={18} color="#FFF" />
        <Text style={styles.checkoutBtnText}>
          {language === 'ar' ? 'المتابعة للدفع' : 'Checkout'}
        </Text>
        <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#FFF" />
      </Pressable>
    </View>
  ), [colors, language, isRTL, getSubtotal, getTotalSavings, onCheckout]);

  // List Header
  const ListHeaderComponent = useCallback(() => (
    <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {language === 'ar' ? 'سلة التسوق' : 'Shopping Cart'}
      </Text>
      <View style={[styles.countBadge, { backgroundColor: NEON_NIGHT_THEME.primary }]}>
        <Text style={styles.countBadgeText}>{getItemCount()}</Text>
      </View>
    </View>
  ), [colors, language, isRTL, getItemCount]);

  // List Footer with summary
  const ListFooterComponent = useCallback(() => (
    <>
      {safeCartItems.length > 0 && <OrderSummary />}
      <View style={{ height: 100 }} />
    </>
  ), [safeCartItems.length, OrderSummary]);

  // Empty state
  const ListEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <EmptyState
        icon="cart-outline"
        title={language === 'ar' ? 'السلة فارغة' : 'Cart is empty'}
        actionLabel={language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
        onAction={() => router.push('/')}
      />
    </View>
  ), [language, router, colors]);

  return (
    <FlashList
      data={safeCartItems}
      renderItem={renderCartItem}
      keyExtractor={(item, index) => item.product_id || `cart-item-${index}`}
      estimatedItemSize={80}
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
  cartItem: {
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
  bundleBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  finalPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  removeBtn: {
    padding: 6,
    borderWidth: 1,
    borderRadius: 6,
  },
  summaryContainer: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savingsLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CartTab;
