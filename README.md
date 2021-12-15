# Santomatic

Santomatic is a [Pyodide](https://pyodide.org/) app for assigning people to give
gifts to each other in a [Secret Santa](https://en.wikipedia.org/wiki/Secret_Santa)
setup.

The basic principles are as follows:

1) Partners are assumed to have their own arrangements, so should not get each other.
2) Gifters should not get the same giftee too often.

To operationalize (2), gifters *cannot* get the same giftee two years running.
Additionally, they should be more likely to get someone the longer ago they last
got them.

Finally, this algorithm prefers to have complete cycles, such that if there is any
way to satisfy the constraints, 6 people will be arranged
A -> B -> C -> D -> E -> F -> A, rather than A -> B -> C -> A and D -> E -> F -> D.

Configuration is done via a basic YAML (see [example.yml](example.yml)).
