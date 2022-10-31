import js
import networkx as nx
import numpy as np
import operator as op


class ArithmeticGraph(nx.DiGraph):
    def _op(self, arg, op):
        ret = self.__class__(self.copy())
        for n1, n2 in arg.edges():
            if n1 in ret and n2 in ret[n1]:
                val = op(ret[n1][n2]['weight'], arg[n1][n2]['weight'])
                if val <= 0:
                    ret.remove_edge(n1, n2)
                else:
                    ret.add_edge(n1, n2, weight=val)
        return ret

    def __sub__(self, arg):
        return self._op(arg, op.sub)

    def __mul__(self, arg):
        return self._op(arg, op.mul)

    def __truediv__(self, arg):
        return self._op(arg, op.truediv)

    @classmethod
    def from_cycles(cls, cycles, weight=1):
        g = cls()
        for cycle in cycles:
            nx.add_cycle(g, cycle, weight=weight)
        return g


def initial(people, partners=nx.Graph()):
    base = nx.Graph()
    base.add_weighted_edges_from(
        (giver, giftee, 1)
        for giver in people
        for giftee in people
        if giver != giftee
    )
    base.remove_edges_from(partners.edges())
    return ArithmeticGraph(base.to_directed())


def cycle_length_prod(graph, cycle):
    nexts = cycle[1:] + cycle[:1]
    return np.prod([graph[n1][n2]['weight'] for n1, n2 in zip(cycle, nexts)])


def choose_cycle(graph):
    all_cycles = [
        cycle
        for cycle in nx.algorithms.simple_cycles(graph)
        if len(cycle) == len(graph)
    ]
    print(f'{len(all_cycles)} candidates')
    probs = [cycle_length_prod(graph, cycle) for cycle in all_cycles]
    cdf = np.cumsum([0] + probs)
    percentages = 100 * np.array(probs) / cdf[-1]
    print(
        f'Probability range: {percentages.min():.03f}%-{percentages.max():.03f}%'
    )
    cdf /= cdf[-1]
    index = np.nonzero(np.random.uniform() > cdf)[0][-1]
    print(f'Selected probability: {percentages[index]:.03f}%')
    return all_cycles[index]


def select(people, partners, previous_years, penalty=0.65):
    base = initial(people, partners)
    for i, cycles in enumerate(previous_years):
        base = base * ArithmeticGraph.from_cycles(cycles, 1 - penalty**i)

    stoch = nx.stochastic_graph(base)

    res = nx.DiGraph()
    for comp in nx.algorithms.weakly_connected_components(stoch):
        nx.add_cycle(res, choose_cycle(stoch.subgraph(comp)))

    return res


def format_selection(selection, people):
    lines = ['', 'Selection', '---------']
    for giver in people:
        lines.append(
            '{}: {}'.format(giver, list(selection.successors(giver))[0])
        )

    return '\n'.join(lines)
