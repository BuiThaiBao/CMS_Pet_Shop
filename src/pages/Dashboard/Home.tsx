import { useTranslation } from "react-i18next";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import OrderStatusChart from "../../components/ecommerce/OrderStatusChart";
import CategoryRevenueChart from "../../components/ecommerce/CategoryRevenueChart";
import TopProductsTable from "../../components/ecommerce/TopProductsTable";
import TopCustomersTable from "../../components/ecommerce/TopCustomersTable";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  const { t } = useTranslation();
  return (
    <>
      <PageMeta
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />
      
      <div className="space-y-6">
        {/* Row 1: Metrics Cards */}
        <EcommerceMetrics />

        {/* Row 2: Monthly Sales + Order Status */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7">
            <MonthlySalesChart />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <OrderStatusChart />
          </div>
        </div>

        {/* Row 3: Category Revenue Chart */}
        <CategoryRevenueChart />

        {/* Row 4: Top Products + Top Customers */}
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 xl:col-span-7">
            <TopProductsTable />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <TopCustomersTable />
          </div>
        </div>
      </div>
    </>
  );
}
