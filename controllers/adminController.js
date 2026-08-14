const Order = require('../models/Order');
const User = require('../models/User');
const { MenuItem, Category } = require('../models/Menu');
const PromoCode = require('../models/PromoCode');
const pool = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    const [ordersResult, usersResult, itemsResult, revenueResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'placed\') as pending, COUNT(*) FILTER (WHERE status = \'preparing\') as preparing, COUNT(*) FILTER (WHERE status = \'delivered\') as delivered FROM orders'),
      pool.query('SELECT COUNT(*) as total FROM users WHERE role = \'customer\''),
      pool.query('SELECT COUNT(*) as total FROM menu_items'),
      pool.query('SELECT COALESCE(SUM(total), 0) as total_revenue, COALESCE(SUM(total) FILTER (WHERE created_at >= CURRENT_DATE), 0) as today_revenue FROM orders WHERE status != \'cancelled\''),
    ]);

    res.json({
      totalOrders: parseInt(ordersResult.rows[0].total),
      pendingOrders: parseInt(ordersResult.rows[0].pending),
      preparingOrders: parseInt(ordersResult.rows[0].preparing),
      deliveredOrders: parseInt(ordersResult.rows[0].delivered),
      totalUsers: parseInt(usersResult.rows[0].total),
      totalMenuItems: parseInt(itemsResult.rows[0].total),
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
      todayRevenue: parseFloat(revenueResult.rows[0].today_revenue),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await Order.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 20, status });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.updateStatus(req.params.id, status, note);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};

exports.getSalesData = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const [salesStats, popularItems, paymentBreakdown] = await Promise.all([
      Order.getSalesStats({ start_date, end_date }),
      Order.getPopularItems({ start_date, end_date }),
      pool.query(`
        SELECT payment_method, COUNT(*) as count, SUM(total) as total
        FROM orders WHERE status != 'cancelled'
        ${start_date ? 'AND created_at >= $1' : ''}
        ${end_date ? `AND created_at <= ${start_date ? '$2' : '$1'}` : ''}
        GROUP BY payment_method
      `, [start_date, end_date].filter(Boolean)),
    ]);

    res.json({ salesStats, popularItems, paymentBreakdown: paymentBreakdown.rows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales data', error: error.message });
  }
};

exports.exportSalesCSV = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const salesStats = await Order.getSalesStats({ start_date, end_date });
    const popularItems = await Order.getPopularItems({ start_date, end_date });

    let csv = 'Date,Orders,Gross Sales (GH₵),Discounts (GH₵),Net Sales (GH₵),Avg Order Value (GH₵)\n';
    for (const row of salesStats) {
      csv += `${row.date},${row.order_count},${parseFloat(row.gross_sales).toFixed(2)},${parseFloat(row.total_discounts).toFixed(2)},${parseFloat(row.net_sales).toFixed(2)},${parseFloat(row.avg_order_value).toFixed(2)}\n`;
    }

    csv += '\n\nPopular Items\nItem,Quantity Sold,Revenue (GH₵)\n';
    for (const item of popularItems) {
      csv += `"${item.name}",${item.total_quantity},${parseFloat(item.total_revenue).toFixed(2)}\n`;
    }

    const totalOrders = salesStats.reduce((s, r) => s + parseInt(r.order_count), 0);
    const totalRevenue = salesStats.reduce((s, r) => s + parseFloat(r.net_sales), 0);
    csv += `\n\nSummary\nTotal Orders,${totalOrders}\nTotal Revenue,"GH₵${totalRevenue.toFixed(2)}"\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting sales data', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};
