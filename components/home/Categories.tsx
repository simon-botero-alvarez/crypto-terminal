import { fetcher } from '@/lib/coingecko.actions';
import DataTable from '@/components/DataTable';
import Image from 'next/image';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { CategoriesFallback } from './fallback';

/*
  📊 FLUJO DEL COMPONENTE CATEGORIES:
  
  1. Componente se monta (es un Server Component async)
     ↓
  2. fetcher obtiene las categorías de la API (/coins/categories)
     ↓
  3. Se definen las columnas de la tabla (Name, Top Gainers, 24h Change, etc)
     ↓
  4. Para cada columna se define cómo renderizar los datos
     ↓
  5. Se renderiza la tabla con las primeras 10 categorías
     ↓
  6. Si hay error en la API, se muestra el componente CategoriesFallback
*/

const Categories = async () => {
  try {
    // Obtener todas las categorías de criptomonedas desde la API
    const categories = await fetcher<Category[]>('/coins/categories');

    // Definir las columnas que va a mostrar la tabla
    const columns: DataTableColumn<Category>[] = [
      // Columna 1: Nombre de la categoría
      { 
        header: 'Category', 
        cellClassName: 'category-cell', 
        cell: (category) => category.name 
      },

      // Columna 2: Mostrar imágenes de las 3 monedas principales de la categoría
      {
        header: 'Top Gainers',
        cellClassName: 'top-gainers-cell',
        cell: (category) =>
          category.top_3_coins.map((coin) => (
            <Image src={coin} alt={coin} key={coin} width={28} height={28} />
          )),
      },

      // Columna 3: Cambio de capitalización en las últimas 24 horas
      {
        header: '24h Change',
        cellClassName: 'change-header-cell',
        cell: (category) => {
          // Determinar si el valor es positivo (verde) o negativo (rojo)
          const isTrendingUp = category.market_cap_change_24h > 0;

          return (
            <div className={cn('change-cell', isTrendingUp ? 'text-green-500' : 'text-red-500')}>
              <p className="flex items-center">
                {/* Mostrar el porcentaje de cambio */}
                {formatPercentage(category.market_cap_change_24h)}
                {/* Mostrar icono de flecha (arriba si sube, abajo si baja) */}
                {isTrendingUp ? (
                  <TrendingUp width={16} height={16} />
                ) : (
                  <TrendingDown width={16} height={16} />
                )}
              </p>
            </div>
          );
        },
      },

      // Columna 4: Capitalización de mercado total de la categoría
      {
        header: 'Market Cap',
        cellClassName: 'market-cap-cell',
        cell: (category) => formatCurrency(category.market_cap),
      },

      // Columna 5: Volumen de trading en las últimas 24 horas
      {
        header: '24h Volume',
        cellClassName: 'volume-cell',
        cell: (category) => formatCurrency(category.volume_24h),
      },
      
    ];

    // Renderizar la tabla con las primeras 10 categorías
    return (
      <div id="categories" className="custom-scrollbar">
        <h4>Top Categories</h4>

        <DataTable
          columns={columns}
          data={categories?.slice(0, 10)}  /* Solo mostrar las 10 primeras */
          rowKey={(_, index) => index}     /* Usar el índice como key */
          tableClassName="mt-3"
        />
      </div>
    );
  } catch (error) {
    // Si hay error en la API, mostrar el componente fallback
    console.error('Error fetching categories:', error);
    return <CategoriesFallback />;
  }
};

export default Categories;