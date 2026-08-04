      {/* Main Content */}
      {activeTab === 'ORDERS' ? (
        <ScrollView style={[styles.scrollContent, { padding: THEME.SPACING.lg }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.queueHeaderRow, { marginBottom: THEME.SPACING.sm + 4 }]}>
            <View style={[styles.queueHeaderLeft, { gap: THEME.SPACING.sm }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${THEME.COLORS.brand.primary}14`, borderColor: `${THEME.COLORS.brand.primary}33` }]}>
                <Flame size={14} color={THEME.COLORS.brand.primary} />
              </View>
              <View>
                <Text style={[styles.queueTitle, { color: colors.textPrimary }]}>Restaurant Cooking Queue</Text>
                <Text style={[styles.queueSubtitle, { color: colors.textMuted }]}>Track & manage all kitchen preparations in real-time</Text>
              </View>
            </View>
            <Pressable
              onPress={() => fetchServerOrders(true)}
              style={[styles.refreshBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            >
              <RefreshCw size={12} color={isDarkMode ? colors.textPrimary : THEME.COLORS.light.textSecondary} />
            </Pressable>
          </View>

          {/* Bulk Prep Box */}
          {aggregatedPrepItems.length > 0 && (
            <View style={[styles.bulkPrepBox, { backgroundColor: `${THEME.COLORS.brand.primary}0A`, borderColor: `${THEME.COLORS.brand.primary}28` }]}>
              <View style={[styles.bulkPrepHeader, { marginBottom: THEME.SPACING.sm + 2 }]}>
                <ChefHat size={14} color={THEME.COLORS.brand.primary} />
                <Text style={[styles.bulkPrepTitle, { color: THEME.COLORS.brand.primary }]}>Kitchen Prep Summary (Bulk Prepare)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: THEME.SPACING.sm + 4 }}>
                {aggregatedPrepItems.map((item, idx) => (
                  <View key={idx} style={[styles.prepChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <Text style={[styles.prepChipText, { color: colors.textPrimary }]}>{item.name}</Text>
                    <View style={[styles.prepChipBadge, { backgroundColor: THEME.COLORS.brand.primary }]}>
                      <Text style={styles.prepChipBadgeText}>x{item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {pendingCafeOrders.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>🍳</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No restaurant items pending cooking</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Restaurant orders placed on the customer app sync instantly to the chef console.
              </Text>
            </View>
          ) : (
            <View style={{ gap: THEME.SPACING.md + 4, marginBottom: THEME.SPACING.xxl }}>
              {pendingCafeOrders.map((ord) => {
                const cafeItems = ord.items.filter(it => isTargetCategory(it.categorySlug));
                const isPending = ord.status === 'PENDING';
                return (
                  <View key={ord.id} style={[styles.orderCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    <View style={[styles.orderCardHeader, { borderBottomColor: colors.border }]}>
                      <View>
                        <Text style={[styles.orderJobTitle, { color: colors.textPrimary }]}>Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                        <Text style={[styles.orderTime, { color: colors.textMuted }]}>Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>

                      {/* Gradient Status badge */}
                      <LinearGradient
                        colors={isPending ? ['#f59e0b', '#d97706'] : [THEME.COLORS.brand.primary, '#be123c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.statusBadge, { borderRadius: THEME.RADIUS.pill }]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {isPending ? 'Pending' : 'Preparing'}
                        </Text>
                      </LinearGradient>
                    </View>

                    {isPending ? (
                      <View>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Items Preview</Text>
                        <View style={{ gap: THEME.SPACING.sm, opacity: 0.75, marginBottom: THEME.SPACING.md + 4 }}>
                          {cafeItems.map((item) => (
                            <View key={item.id} style={[styles.previewItem, { backgroundColor: `${colors.textPrimary}06`, borderColor: `${colors.textPrimary}14` }]}>
                              <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                                <Text style={[styles.previewItemName, { color: colors.textPrimary }]}>{item.name}</Text>
                                <Text style={[styles.previewItemQty, { color: `${colors.textPrimary}99` }]}>Quantity: x{item.quantity}</Text>
                                {item.notes && (
                                  <Text style={[styles.previewItemNotes, { color: THEME.COLORS.brand.accent }]}>🗒️ Note: {item.notes}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', gap: THEME.SPACING.sm + 2 }}>
                          <TouchableOpacity
                            onPress={() => handleEditOrder(ord)}
                            style={[styles.editBtn, { borderColor: colors.border }]}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit Order</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => startPreparingChef(ord)}
                            style={{ flex: 2, height: 42, borderRadius: 14, overflow: 'hidden' }}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={[THEME.COLORS.brand.primary, '#be123c']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            >
                              <ChefHat size={13} color="#ffffff" />
                              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>Start Cooking</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Items to Cook (Tap to ready)</Text>
                        <View style={{ gap: THEME.SPACING.sm + 2 }}>
                          {cafeItems.map((item) => (
                            <Pressable
                              key={item.id}
                              onPress={() => markChefItemReady(ord.id, item.id)}
                              style={[styles.cookItemRow, item.cooked ? styles.cookItemRowReady : { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border }]}
                            >
                              <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                                <Text style={[styles.cookItemName, item.cooked ? { color: colors.textMuted, textDecorationLine: 'line-through' } : { color: colors.textPrimary }]}>
                                  {item.name}
                                </Text>
                                <Text style={[styles.cookItemQty, { color: `${colors.textPrimary}88` }]}>Quantity: x{item.quantity}</Text>
                                {item.notes && (
                                  <Text style={[styles.cookItemNotes, { color: THEME.COLORS.brand.accent }]}>🗒️ Note: {item.notes}</Text>
                                )}
                              </View>

                              {/* Interactive check badge */}
                              <View style={[styles.checkBadge, item.cooked ? styles.checkBadgeDone : { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                                {item.cooked ? (
                                  <Check size={12} color="#ffffff" strokeWidth={3.5} />
                                ) : (
                                  <Text style={[styles.checkBadgePlus, { color: colors.textMuted }]}>+</Text>
                                )}
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: THEME.SPACING.xxl }} />
        </ScrollView>
      ) : activeTab === 'ANALYTICS' ? (
        <View style={{ flex: 1, paddingHorizontal: THEME.SPACING.lg }}>
          {/* Preset Buttons */}
          <View style={[styles.presetRow, { backgroundColor: `${colors.textPrimary}08`, borderColor: `${colors.textPrimary}18` }]}>
            {(['today', 'yesterday', '7days', '30days'] as const).map((preset) => (
              <Pressable
                key={preset}
                onPress={() => { triggerHaptic('light'); setRangePreset(preset); }}
                style={[styles.presetBtn, rangePreset === preset && { backgroundColor: colors.surfaceElevated, ...THEME.SHADOWS.sm }]}
              >
                <Text style={[styles.presetBtnText, rangePreset === preset ? { color: THEME.COLORS.brand.primary, fontWeight: '800' as const } : { color: colors.textSecondary }]}>
                  {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yday' : preset === '7days' ? '7 Days' : '30 Days'}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoadingReports ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: THEME.SPACING.xxl * 2 }}>
              <ActivityIndicator size="small" color={THEME.COLORS.brand.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading analytics...</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Financial Metrics Grid */}
              <View style={[styles.metricsGrid, { gap: THEME.SPACING.sm + 4, marginBottom: THEME.SPACING.md + 4 }]}>
                {/* Gross Revenue */}
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.metricAccent, { backgroundColor: THEME.COLORS.brand.success }]} />
                  <View style={[styles.metricRow, { marginBottom: THEME.SPACING.xs }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Gross Sales</Text>
                    <TrendingUp size={12} color={THEME.COLORS.brand.success} />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{summary.totalSales || 0}</Text>
                </View>

                {/* Net Profit */}
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.metricAccent, { backgroundColor: THEME.COLORS.brand.primary }]} />
                  <View style={[styles.metricRow, { marginBottom: THEME.SPACING.xs }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Net Profit</Text>
                    <Percent size={11} color={THEME.COLORS.brand.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{summary.netProfit || 0}</Text>
                </View>

                {/* Orders Count */}
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.metricAccent, { backgroundColor: '#3b82f6' }]} />
                  <View style={[styles.metricRow, { marginBottom: THEME.SPACING.xs }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Orders</Text>
                    <ShoppingBag size={11} color="#3b82f6" />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{summary.ordersCount || 0}</Text>
                </View>

                {/* Avg Value */}
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.metricAccent, { backgroundColor: '#8b5cf6' }]} />
                  <View style={[styles.metricRow, { marginBottom: THEME.SPACING.xs }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Avg Value</Text>
                    <DollarSign size={11} color="#8b5cf6" />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.textPrimary }]}>₹{Math.round(summary.avgOrderValue || 0)}</Text>
                </View>
              </View>

              {/* Top Products */}
              <View style={[styles.topProductsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, marginBottom: THEME.SPACING.xxl }]}>
                <Text style={[styles.topProductsTitle, { color: colors.textPrimary }]}>🔥 Top Selling Restaurant Items</Text>
                {topProducts.length === 0 ? (
                  <Text style={[styles.topProductsEmpty, { color: colors.textSecondary }]}>No top products data for this period</Text>
                ) : (
                  <View style={{ gap: THEME.SPACING.sm + 4 }}>
                    {(() => {
                      const maxQty = Math.max(...topProducts.map(p => p.quantity), 1);
                      return topProducts.map((prod, idx) => {
                        const pct = (prod.quantity / maxQty) * 100;
                        return (
                          <View key={idx} style={[styles.topProductRow, { borderBottomColor: colors.border, paddingBottom: THEME.SPACING.sm + 4 }]}>
                            <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                              <Text style={[styles.topProductName, { color: colors.textPrimary }]} numberOfLines={1}>{prod.name}</Text>
                              <Text style={[styles.topProductQty, { color: colors.textMuted }]}>Qty sold: x{prod.quantity}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={[styles.topProductSales, { color: colors.textPrimary }]}>₹{prod.sales}</Text>
                              <Text style={[styles.topProductProfit, { color: THEME.COLORS.brand.success }]}>Profit: ₹{prod.profit}</Text>
                            </View>
                            {/* Horizontal progress bar */}
                            <View style={[styles.progressTrack, { backgroundColor: `${colors.textPrimary}0D` }]}>
                              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: THEME.COLORS.brand.primary }]} />
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: THEME.SPACING.lg }}>
          {/* Search Bar */}
          <View style={[styles.invSearchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Search size={14} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} style={{ marginRight: THEME.SPACING.sm }} />
            <TextInput
              value={inventorySearchQuery}
              onChangeText={setInventorySearchQuery}
              placeholder="Search restaurant menu..."
              placeholderTextColor={isDarkMode ? colors.textSecondary : colors.textMuted}
              style={[styles.invSearchInput, { color: colors.textPrimary }]}
            />
          </View>

          {isLoadingInventory ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: THEME.SPACING.xxl * 2 }}>
              <ActivityIndicator size="small" color={THEME.COLORS.brand.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading items...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No items found</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: THEME.SPACING.sm, marginBottom: THEME.SPACING.xxl }}>
                {filteredProducts.map((product) => {
                  const available = product.isAvailable !== false;
                  const isNonVeg = product.tags?.some((t: string) => t.toLowerCase() === 'non-veg') || false;
                  return (
                    <View key={product.id} style={[styles.invProductCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                      <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                        <View style={[styles.invTagRow, { gap: THEME.SPACING.xs + 2, marginBottom: THEME.SPACING.xs + 2 }]}>
                          <View style={[styles.invTag, isNonVeg ? { backgroundColor: `${THEME.COLORS.brand.primary}0D`, borderColor: `${THEME.COLORS.brand.primary}28` } : { backgroundColor: `${THEME.COLORS.brand.success}0D`, borderColor: `${THEME.COLORS.brand.success}28` }]}>
                            <Text style={[styles.invTagText, isNonVeg ? { color: THEME.COLORS.brand.primary } : { color: THEME.COLORS.brand.success }]}>
                              {isNonVeg ? 'NON-VEG' : 'VEG'}
                            </Text>
                          </View>
                          <Text style={[styles.invCategory, { color: colors.textMuted }]}>{product.category?.name || 'Food'}</Text>
                        </View>
                        <Text style={[styles.invProductName, { color: colors.textPrimary }]}>{product.name}</Text>
                        <Text style={[styles.invProductPrice, { color: `${colors.textPrimary}cc` }]}>₹{product.price}</Text>
                      </View>

                      {/* Toggle capsule button */}
                      <View style={{ alignItems: 'center' }}>
                        <Pressable
                          onPress={() => toggleProductAvailability(product.id, available)}
                          style={[styles.toggleBtn, available ? styles.toggleBtnAvailable : { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                        >
                          <View style={[styles.toggleDot, { backgroundColor: available ? THEME.COLORS.brand.success : colors.textMuted }]} />
                          <Text style={[styles.toggleBtnText, available ? { color: THEME.COLORS.brand.success } : { color: colors.textSecondary }]}>
                            {available ? 'Available' : 'Out of Stock'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={{ height: THEME.SPACING.xxl }} />
            </ScrollView>
          )}
        </View>
      )}

      <NewOrderAlertModal
        order={activeAlertOrder}
        onAccept={async (id) => {
          const success = await acceptOrder(id);
          if (success) refreshAlerts();
          return success;
        }}
        onDismiss={acknowledgeAlert}
        isDarkMode={isDarkMode}
      />

      {/* Order Edit Modal */}
      <Modal
        visible={editingOrder !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingOrder(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: `${colors.textPrimary}99` }]}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderRadius: THEME.RADIUS.xl, padding: THEME.SPACING.lg, maxHeight: '85%' }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingBottom: THEME.SPACING.sm, marginBottom: THEME.SPACING.sm }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Order Items</Text>
                <Text style={[styles.modalJob, { color: colors.textSecondary }]}>Job #{editingOrder?.id.slice(-6).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrder(null)} style={{ padding: 4 }}>
                <X size={16} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Catalog Search Input */}
            <View style={{ position: 'relative', marginBottom: THEME.SPACING.sm, zIndex: 50 }}>
              <View style={[styles.modalSearchBar, { backgroundColor: `${colors.textPrimary}0D`, borderColor: colors.border }]}>
                <Search size={14} color={isDarkMode ? `${colors.textPrimary}99` : THEME.COLORS.light.textSecondary} style={{ marginRight: THEME.SPACING.sm }} />
                <TextInput
                  placeholder="Search catalog to add items..."
                  placeholderTextColor={isDarkMode ? colors.textSecondary : colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.modalSearchInput, { color: colors.textPrimary }]}
                />
              </View>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <View style={[styles.suggestionsDropdown, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <ScrollView nestedScrollEnabled={true}>
                    {searchResults.map((prod) => (
                      <TouchableOpacity
                        key={prod.id}
                        onPress={() => addCatalogItem(prod)}
                        style={[styles.suggestionRow, { borderBottomColor: `${colors.textPrimary}14` }]}
                      >
                        <Text style={[styles.suggestionName, { color: colors.textPrimary }]}>{prod.name}</Text>
                        <Text style={[styles.suggestionPrice, { color: THEME.COLORS.brand.primary }]}>₹{prod.price}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Scrollable list of current items */}
            <ScrollView style={{ flexGrow: 0, flexShrink: 1, marginBottom: THEME.SPACING.sm }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {editItems.length === 0 ? (
                <View style={{ paddingVertical: THEME.SPACING.lg, alignItems: 'center' }}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>No items in order. Add items from catalog search.</Text>
                </View>
              ) : (
                editItems.map((item, idx) => {
                  const prodDetails = allProducts.find(p => p.id === item.productId);
                  const variants = prodDetails?.variants as any[] | undefined;
                  const hasItemVariants = variants && Array.isArray(variants) && variants.length > 0;

                  return (
                    <View key={idx} style={[styles.editItemRow, { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border, marginBottom: THEME.SPACING.sm }]}>
                      <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                        <Text style={[styles.editItemName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.editItemPrice, { color: colors.textSecondary, marginTop: 2 }]}>₹{item.price}</Text>

                        {/* Variant Swap Selector */}
                        {hasItemVariants && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs, marginTop: THEME.SPACING.sm }}>
                            <Text style={[styles.variantLabel, { color: colors.textSecondary }]}>Variant:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: THEME.SPACING.xs }}>
                              {variants.map((v) => {
                                const isSelected = item.selectedVariant === v.name;
                                return (
                                  <TouchableOpacity
                                    key={v.name}
                                    onPress={() => updateItemVariant(item.productId, item.selectedVariant, v.name, v.price)}
                                    style={[styles.variantChip, isSelected ? { borderColor: THEME.COLORS.brand.primary, backgroundColor: `${THEME.COLORS.brand.primary}1A` } : { borderColor: colors.border }]}
                                  >
                                    <Text style={[styles.variantChipText, isSelected ? { color: THEME.COLORS.brand.primary } : { color: colors.textSecondary }]}>
                                      {v.name} (₹{v.price})
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                        <View style={[styles.qtyControl, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, -1)}
                            style={{ padding: 6 }}
                          >
                            <Minus size={10} color={isDarkMode ? colors.textPrimary : THEME.COLORS.light.textSecondary} strokeWidth={3} />
                          </TouchableOpacity>
                          <Text style={{ paddingHorizontal: THEME.SPACING.sm + 4, fontSize: 11, fontWeight: '900', color: colors.textPrimary, minWidth: 18, textAlign: 'center' }}>
                            {item.quantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, 1)}
                            style={{ padding: 6 }}
                          >
                            <Plus size={10} color={isDarkMode ? colors.textPrimary : THEME.COLORS.light.textSecondary} strokeWidth={3} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={() => markItemOutOfStock(item.productId)}
                          style={{ padding: 6, backgroundColor: `${THEME.COLORS.brand.primary}1A`, borderRadius: 10 }}
                        >
                          <AlertTriangle size={12} color={THEME.COLORS.brand.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Recalculated Live Bill Preview */}
            {(() => {
              const computedSubtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const computedDeliveryFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (computedSubtotal < freeDeliveryThreshold ? deliveryFeeSetting : 0);
              const computedMiscFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (editingOrder?.miscFee === 0 ? 0 : miscFeeSetting);
              const computedTaxes = parseFloat((computedSubtotal * editTaxRate).toFixed(2));
              const computedTotal = computedSubtotal + computedDeliveryFee + computedTaxes + computedMiscFee - (editingOrder?.discount || 0);

              return (
                <View style={[styles.billPreview, { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.billLineLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                    <Text style={[styles.billLineValue, { color: colors.textPrimary }]}>₹{computedSubtotal}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.billLineLabel, { color: colors.textSecondary }]}>Taxes ({Math.round(editTaxRate * 100)}%)</Text>
                    <Text style={[styles.billLineValue, { color: colors.textPrimary }]}>₹{computedTaxes}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.billLineLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
                    <Text style={[styles.billLineValue, { color: colors.textPrimary }]}>₹{computedDeliveryFee}</Text>
                  </View>
                  {computedMiscFee > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[styles.billLineLabel, { color: colors.textSecondary }]}>Handling / Packaging Fee</Text>
                      <Text style={[styles.billLineValue, { color: colors.textPrimary }]}>₹{computedMiscFee}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.billLineLabel, { color: colors.textSecondary }]}>Discount</Text>
                    <Text style={[styles.billLineValue, { color: colors.textPrimary }]}>-₹{editingOrder?.discount || 0}</Text>
                  </View>
                  <View style={[styles.billTotalRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.billTotalLabel, { color: colors.textPrimary }]}>Estimated Total</Text>
                    <Text style={[styles.billTotalValue, { color: THEME.COLORS.brand.primary }]}>₹{computedTotal}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: THEME.SPACING.sm + 2 }}>
              <TouchableOpacity
                onPress={() => setEditingOrder(null)}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isSavingEdit}
                onPress={saveEditedOrder}
                style={[styles.modalSaveBtn, { backgroundColor: THEME.COLORS.brand.primary, opacity: isSavingEdit ? 0.6 : 1 }]}
              >
                <Text style={styles.modalSaveBtnText}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  queueSubtitle: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  refreshBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkPrepBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.md,
  },
  bulkPrepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 2,
  },
  bulkPrepTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  prepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 4,
    gap: THEME.SPACING.sm,
  },
  prepChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prepChipBadge: {
    borderRadius: THEME.RADIUS.pill,
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
  },
  prepChipBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: THEME.SPACING.xxl,
    alignItems: 'center',
    paddingTop: THEME.SPACING.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: THEME.SPACING.sm,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: THEME.SPACING.sm + 2,
  },
  emptySubtitle: {
    fontSize: 10,
    marginTop: THEME.SPACING.sm + 2,
    textAlign: 'center',
    maxWidth: 280,
  },
  orderCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: THEME.SPACING.md + 4,
    ...THEME.SHADOWS.sm,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: THEME.SPACING.sm + 2,
    marginBottom: THEME.SPACING.sm + 2,
  },
  orderJobTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  orderTime: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: THEME.SPACING.sm + 4,
    paddingVertical: THEME.SPACING.xs + 1,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: THEME.SPACING.sm + 2,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewItemName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  previewItemQty: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  previewItemNotes: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: THEME.SPACING.xs + 2,
  },
  editBtn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cookItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  cookItemReady: {
    backgroundColor: `${THEME.COLORS.brand.success}14`,
    borderColor: `${THEME.COLORS.brand.success}40`,
  },
  cookItemName: {
    fontSize: 12,
    fontWeight: '700',
  },
  cookItemQty: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  cookItemNotes: {
    fontSize: 9,
    fontWeight: '900',
    marginTop: THEME.SPACING.xs + 2,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  checkBadgeDone: {
    backgroundColor: THEME.COLORS.brand.success,
    borderColor: THEME.COLORS.brand.success,
  },
  checkBadgePlus: {
    fontSize: 10,
    fontWeight: '900',
  },
  presetRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    padding: THEME.SPACING.xs,
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 1,
    marginBottom: THEME.SPACING.md + 4,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  loadingText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: THEME.SPACING.sm,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: THEME.SPACING.md,
    width: '48%',
    overflow: 'hidden',
    position: 'relative',
  },
  metricAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  topProductsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: THEME.SPACING.md + 4,
    ...THEME.SHADOWS.xs,
  },
  topProductsTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginBottom: THEME.SPACING.sm + 4,
  },
  topProductsEmpty: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: THEME.SPACING.lg,
  },
  topProductRow: {
    borderBottomWidth: 1,
    paddingBottom: THEME.SPACING.sm + 4,
  },
  topProductName: {
    fontSize: 12,
    fontWeight: '800',
  },
  topProductQty: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  topProductSales: {
    fontSize: 11,
    fontWeight: '900',
  },
  topProductProfit: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: THEME.SPACING.sm + 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  invSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: THEME.SPACING.md + 2,
    paddingVertical: THEME.SPACING.sm + 4,
    marginBottom: THEME.SPACING.md + 4,
  },
  invSearchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  invProductCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: THEME.SPACING.sm + 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invTag: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
  },
  invTagText: {
    fontSize: 7.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  invCategory: {
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  invProductName: {
    fontSize: 12,
    fontWeight: '800',
  },
  invProductPrice: {
    fontSize: 10,
    fontWeight: '900',
    marginTop: THEME.SPACING.xs + 2,
  },
  toggleBtn: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 2,
    minWidth: 110,
    justifyContent: 'center',
  },
  toggleBtnAvailable: {
    backgroundColor: `${THEME.COLORS.brand.success}14`,
    borderColor: `${THEME.COLORS.brand.success}40`,
  },
  toggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toggleBtnText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.lg,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalJob: {
    fontSize: 9.5,
    fontWeight: '800',
    marginTop: 2,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: THEME.SPACING.sm + 4,
    height: 40,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    padding: 0,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    maxHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 100,
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.sm + 4,
    paddingVertical: THEME.SPACING.sm,
    borderBottomWidth: 0.5,
  },
  suggestionName: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginRight: THEME.SPACING.sm,
  },
  suggestionPrice: {
    fontSize: 11,
    fontWeight: '900',
  },
  editItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  editItemName: {
    fontSize: 11,
    fontWeight: '800',
  },
  editItemPrice: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  variantLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  variantChip: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs + 1,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: THEME.SPACING.xs,
  },
  variantChipText: {
    fontSize: 8.5,
    fontWeight: '800',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  billPreview: {
    padding: THEME.SPACING.sm + 4,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: THEME.SPACING.sm,
    gap: THEME.SPACING.xs + 2,
  },
  billLineLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  billLineValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    paddingTop: THEME.SPACING.sm,
    marginTop: THEME.SPACING.xs,
  },
  billTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  billTotalValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  modalCancelBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalSaveBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalEmptyText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
