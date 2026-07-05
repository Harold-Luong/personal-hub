import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../utils/formatCurrency";

const RADIAN = Math.PI / 180;
const maxVisibleLabels = 6;
const minVisiblePercentage = 1;

function getPercentage(category, totalValue) {
    if (Number.isFinite(category.percentage)) {
        return Math.max(Number(category.percentage), 0);
    }

    return totalValue > 0 ? Math.round(((category.amount ?? 0) / totalValue) * 1000) / 10 : 0;
}

function formatPercentage(value) {
    const roundedValue = Math.round(value * 10) / 10;

    return `${String(roundedValue).replace(".", ",")}%`;
}

function getPoint(cx, cy, radius, angle) {
    return {
        x: cx + radius * Math.cos(-angle * RADIAN),
        y: cy + radius * Math.sin(-angle * RADIAN),
    };
}

function buildChartData(categories) {
    const totalAmount = categories.reduce((sum, category) => sum + Math.max(Number(category.amount) || 0, 0), 0);

    return categories
        .map((category, index) => {
            const amount = Math.max(Number(category.amount) || 0, 0);
            const percentage = getPercentage(category, totalAmount);

            return {
                ...category,
                amount,
                chartValue: amount > 0 ? amount : percentage,
                color: category.color || "var(--expense-border)",
                labelKey: `${category.id ?? category.name ?? "category"}-${index}`,
                percentage,
            };
        })
        .filter((category) => category.chartValue > 0);
}

function renderDonutLabel(props) {
    const { cx, cy, index, midAngle, outerRadius, payload } = props;
    const percentage = payload.percentage ?? 0;

    if (percentage < minVisiblePercentage || index >= maxVisibleLabels) {
        return null;
    }

    const start = getPoint(cx, cy, outerRadius + 2, midAngle);
    const bend = getPoint(cx, cy, outerRadius + 11, midAngle);
    const isRightSide = bend.x >= cx;
    const end = {
        x: bend.x + (isRightSide ? 18 : -18),
        y: bend.y,
    };
    const textX = end.x + (isRightSide ? 4 : -4);

    return (
        <g className="category-spending-card__chart-label" style={{ "--chart-label-color": payload.color }}>
            <polyline
                className="category-spending-card__chart-label-line"
                points={`${start.x},${start.y} ${bend.x},${bend.y} ${end.x},${end.y}`}
            />
            <text
                className="category-spending-card__chart-label-text"
                textAnchor={isRightSide ? "start" : "end"}
                x={textX}
                y={end.y}
            >
                {formatPercentage(percentage)}
            </text>
        </g>
    );
}

function DonutTooltip({ active, payload }) {
    if (!active || !payload?.length) {
        return null;
    }

    const category = payload[0].payload;

    return (
        <div className="expenses-chart-tooltip">
            <strong>{category.name}</strong>
            <span>{category.amount ? formatCurrency(category.amount) : formatPercentage(category.percentage)}</span>
            <small>{formatPercentage(category.percentage)} tổng chi</small>
        </div>
    );
}

export default function DonutChart({ categories = [], children }) {
    const chartData = buildChartData(categories);

    return (
        <div className="category-spending-card__chart">
            <ResponsiveContainer height="100%" width="100%">
                <PieChart margin={{ bottom: 22, left: 34, right: 34, top: 22 }}>
                    <Pie
                        cx="50%"
                        cy="50%"
                        data={chartData}
                        dataKey="chartValue"
                        innerRadius="45%"
                        isAnimationActive={true}
                        label={renderDonutLabel}
                        labelLine={false}
                        nameKey="name"
                        outerRadius="82%"
                        paddingAngle={0}
                        rootTabIndex={-1}
                        stroke="var(--expense-surface-solid)"
                        strokeWidth={1}
                    >
                        {chartData.map((category) => (
                            <Cell fill={category.color} focusable={false} key={category.labelKey} />
                        ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} cursor={false} />
                </PieChart>
            </ResponsiveContainer>
            {children ? <div className="category-spending-card__chart-center">{children}</div> : null}
        </div>
    );
}
