
'use client';

import { useEffect, useRef, useState, useTransition } from "react";
import { getCandlestickConfig, getChartConfig, PERIOD_BUTTONS, PERIOD_CONFIG } from "@/constants";
import { CandlestickSeries, createChart, IChartApi, ISeriesApi } from "lightweight-charts";
import { fetcher } from "@/lib/coingecko.actions";
import { convertOHLCData } from "@/lib/utils";


const CandlestickChart = ({
	children,
	data,
	coinId,
	height = 360,
	initialPeriod = 'daily',
	liveOhlcv = null,
	mode = 'historical',
	liveInterval,
	setLiveInterval,
}: CandlestickChartProps) => {

	const chartContainerRef = useRef<HTMLDivElement | null>(null);
	const chartRef = useRef<IChartApi | null>(null);
	const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

	const [loading, setLoading] = useState(false);
	const [period, setPeriod] = useState(initialPeriod);
	const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);
	const [isPending, startTransition] = useTransition();

	const fetchOHLCData = async (selectedPeriod: Period) => {
		try {
			// Obtiene los "days" del período (ej: 7 para 1W)
			const { days } = PERIOD_CONFIG[selectedPeriod];
			// Llama a la API
			const newData = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, {
				vs_currency: 'usd',
				days
			});
			// Actualiza el estado con los nuevos datos
			setOhlcData(newData ?? []);
		} catch (e) {
			console.error('Failed to fetch OHLCData', e);
		}
	}

	const handlePeriodChange = async (newPeriod: Period) => {
		if (newPeriod === period) return;  // ← Si es el mismo período, no hace nada
		startTransition(() => {
			setPeriod(newPeriod)  // ← Cambia el período
		});
		await fetchOHLCData(newPeriod);  // ← Obtiene nuevos datos
	}

	useEffect(() => {
		const container = chartContainerRef.current;
		if (!container) return;  // ← Si no existe el div, salir

		// Mostrar hora solo en períodos cortos
		const showTime = ['daily', 'weekly', 'monthly'].includes(period);

		// Crear el gráfico
		const chart = createChart(container, {
			...getChartConfig(height, showTime),
			width: container.clientWidth,
		})

		// Agregar las velas
		const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());

		// Poner datos en el gráfico
		series.setData(convertOHLCData(ohlcData))
		chart.timeScale().fitContent()  // ← Ajustar al contenedor

		// Guardar referencias para usar después
		chartRef.current = chart;
		candleSeriesRef.current = series;

		// Observer para cuando la ventana se redimensiona
		const observer = new ResizeObserver((entries) => {
			if (!entries.length) return;
			chart.applyOptions({ width: entries[0].contentRect.width })
		});
		observer.observe(container);

		// Limpiar cuando se desmonta el componente
		return () => {
			observer.disconnect();
			chart.remove();
			chartRef.current = null;
			candleSeriesRef.current = null;
		}
	}, [height])  // ← Se ejecuta cuando height cambia

	useEffect(() => {
		if (!candleSeriesRef.current) return;  // ← Si no existe el gráfico, salir

		// Convertir milisegundos a segundos (lo que el gráfico necesita)
		const convertedToSeconds = ohlcData.map((item) =>
			[Math.floor(item[0] / 1000), item[1], item[2], item[3], item[4]] as OHLCData,
		);

		// Convertir formato de datos
		const converted = convertOHLCData(convertedToSeconds);

		// Actualizar datos en el gráfico
		candleSeriesRef.current.setData(converted)

		// Ajustar escala
		chartRef.current?.timeScale().fitContent();

	}, [ohlcData, period])  // ← Se ejecuta cuando cambian los datos o período

	return (
		<div id="candlestick-chart">
			<div className="chart-header">
				<div className="flex-1">{children}</div>

				<div className="button-group">
					<span className="text-sm mx-2 font-medium text-purple-100/50">Period:</span>
					{PERIOD_BUTTONS.map(({ value, label }) => (
						<button
							key={value}
							className={period === value ? 'config-button-active' : 'config-button'}
							onClick={() => handlePeriodChange(value)}
							disabled={loading}>
							{label}
						</button>
					))}
				</div>
			</div>

			<div ref={chartContainerRef} className="chart" style={{ height }} />

		</div>
	)
}

export default CandlestickChart


/*
  📊 FLUJO COMPLETO DEL COMPONENTE:
  
  1. Componente se monta
     ↓
  2. Primer useEffect crea el gráfico en chartContainerRef
     ↓
  3. Segundo useEffect pone datos iniciales en el gráfico
     ↓
  4. Usuario hace click en botón (ej: "1W")
     ↓
  5. handlePeriodChange se ejecuta
     ↓
  6. fetchOHLCData obtiene datos de 7 días de la API
     ↓
  7. setOhlcData actualiza el estado
     ↓
  8. Segundo useEffect se ejecuta (porque cambió ohlcData)
     ↓
  9. Gráfico se actualiza con nuevos datos
*/