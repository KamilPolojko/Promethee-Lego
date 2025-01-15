import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function PrometheeRankingChart({
                                                  rankings,
                                              }: {
    rankings: { name: string; value: number }[] | undefined;
}) {
    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (!rankings || rankings.length === 0) return;

        const width = 500;
        const height = 600;
        const margin = { top: 20, right: 120, bottom: 30, left: 50 };

        d3.select(svgRef.current).selectAll('*').remove();

        const svg = d3
            .select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        const yScale = d3
            .scaleBand()
            .domain(rankings.map((d) => d.name))
            .range([margin.top, height - margin.bottom])
            .padding(0.5);

        const xScale = d3
            .scaleLinear()
            .domain([-1, 1])
            .range([margin.left, width - margin.right]);

        svg.append('line')
            .attr('x1', xScale(0))
            .attr('x2', xScale(0))
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', 'black')
            .attr('stroke-width', 2);

        rankings.forEach((d) => {
            const y = yScale(d.name)! + yScale.bandwidth() / 2;

            svg.append('line')
                .attr('x1', xScale(0))
                .attr('x2', xScale(d.value))
                .attr('y1', y)
                .attr('y2', y)
                .attr('stroke', d.value >= 0 ? 'green' : 'red')
                .attr('stroke-width', 6);

            svg.append('text')
                .attr('x', d.value >= 0 ? xScale(0) - 15 : xScale(d.value) - 15)
                .attr('y', y + 5)
                .attr('text-anchor', 'end')
                .text(d.value.toFixed(4))
                .attr('fill', 'black')
                .attr('font-family', 'Arial')
                .attr('font-size', 12);

            svg.append('text')
                .attr('x', d.value >= 0 ? xScale(d.value) + 10 : xScale(0) + 10)
                .attr('y', y + 5)
                .attr('text-anchor', 'start')
                .text(d.name)
                .attr('fill', 'black')
                .attr('font-family', 'Arial')
                .attr('font-size', 12);
        });

        svg.append('text')
            .attr('x', xScale(0))
            .attr('y', margin.top - 10)
            .attr('text-anchor', 'middle')
            .text('+1.0')
            .attr('fill', 'black')
            .attr('font-family', 'Arial')
            .attr('font-size', 12);

        svg.append('text')
            .attr('x', xScale(0))
            .attr('y', height - margin.bottom + 20)
            .attr('text-anchor', 'middle')
            .text('-1.0')
            .attr('fill', 'black')
            .attr('font-family', 'Arial')
            .attr('font-size', 12);
    }, [rankings]);

    return <svg ref={svgRef}></svg>;
}
