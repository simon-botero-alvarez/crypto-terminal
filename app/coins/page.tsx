import { fetcher } from '@/lib/coingecko.actions';
import Image from 'next/image';
import Link from 'next/link';

import { cn, formatPercentage, formatCurrency } from '@/lib/utils';
import DataTable from '@/components/DataTable';
import CoinsPagination from '@/components/CoinsPagination';

/*
  📊 FLUJO DEL COMPONENTE COINS (Página de todas las monedas):
  
  1. Usuario entra a /coins o /coins?page=2
     ↓
  2. Se lee el parámetro 'page' de la URL
     ↓
  3. Se define currentPage (página actual) y perPage (10 monedas por página)
     ↓
  4. fetcher obtiene 10 monedas de la API según la página
     ↓
  5. Se definen las 5 columnas de la tabla (Rank, Token, Price, 24h Change, Market Cap)
     ↓
  6. Para cada columna se define cómo renderizar los datos
     ↓
  7. Se calcula si hay más páginas (hasMorePages)
     ↓
  8. Se estima el total de páginas
     ↓
  9. Se renderiza la tabla con las monedas y el paginador
     ↓
  10. Usuario hace click en página 2 → vuelve al paso 1
*/

const Coins = async ({ searchParams }: NextPageProps) => {

  // Obtener el parámetro 'page' de la URL (?page=2)
	const { page } = await searchParams;

  // Convertir a número, si no existe usar página 1
	const currentPage = Number(page) || 1;

  // Cantidad de monedas a mostrar por página
	const perPage = 10;

  // Obtener las monedas de la API con los parámetros de paginación
  const coinsData = await fetcher<CoinMarketData[]>('/coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: perPage,
    page: currentPage,
    sparkline: 'false',
    price_change_percentage: '24h',
  });

  // Definir las 5 columnas que va a mostrar la tabla
  const columns: DataTableColumn<CoinMarketData>[] = [

    // Columna 1: Ranking (posición de la moneda)
    {
      header: "Rank",
      cellClassName: "rank-cell",
      cell: (coin) => (
        <>
          #{coin.market_cap_rank}
          <Link href={`/coins/${coin.id}`} aria-label="View coin" />
        </>
      ),
    },

    // Columna 2: Token (logo, nombre y símbolo)
    {
      header: "Token",
      cellClassName: "token-cell",
      cell: (coin) => (
        <div className="token-info">
          <Image src={coin.image} alt={coin.name} width={36} height={36} />
          <p>
            {coin.name} ({coin.symbol.toUpperCase()})
          </p>
        </div>
      ),
    },

    // Columna 3: Precio actual (formateado como dinero)
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (coin) => formatCurrency(coin.current_price),
    },

    // Columna 4: Cambio en 24 horas (con color verde/rojo)
    {
      header: "24h Change",
      cellClassName: "change-cell",
      cell: (coin) => {
        const isTrendingUp = coin.price_change_percentage_24h > 0;

        return (
          <span
            className={cn("change-value", {
              "text-green-600": isTrendingUp,
              "text-red-500": !isTrendingUp,
            })}
          >
            {isTrendingUp && "+"}
            {formatPercentage(coin.price_change_percentage_24h)}
          </span>
        );
      },
    },

    // Columna 5: Capitalización de mercado total (formateado como dinero)
    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: (coin) => formatCurrency(coin.market_cap),
    },
  ];

  // Calcular si hay más páginas (si recibimos exactamente 10 monedas, hay más)
  const hasMorePages = coinsData.length === perPage;

  // Estimar el total de páginas
	// Si estamos en página < 100 → asumir 100 páginas totales
	// Si estamos en página >= 100 → calcular dinámicamente
  const estimatedTotalPages = currentPage >= 100 ? Math.ceil(currentPage / 100) * 100 + 100 : 100;

  return (
    <main id="coins-page">
      <div className="content">
        <h4>All Coins</h4>

        {/* Tabla que muestra las 10 monedas de esta página */}
        <DataTable
          tableClassName="coins-table"
          columns={columns}
          data={coinsData}
          rowKey={(coin) => coin.id}
        />

        {/* Paginador para navegar entre páginas */}
        <CoinsPagination
            currentPage={currentPage}
            totalPages={estimatedTotalPages}
            hasMorePages={hasMorePages}
        />
      </div>
    </main>
  );
};

export default Coins;