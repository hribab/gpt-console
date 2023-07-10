import React from "react";

// reactstrap components
import {
  Button,
  Card,
  CardBody,
  UncontrolledCollapse,
  FormGroup,
  Form,
  Input,
  NavbarBrand,
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Carousel,
  CarouselItem,
  CarouselIndicators,
} from "reactstrap";

// core components
const items = [
  {
    src: "url(" + require("assets/img/sections/section-header-1.jpg") + ")",
    content: (
      <Container>
        <Row>
          <Col className="text-left" md="6">
            <h1 className="title">Paper Kit 2 PRO</h1>
            <h5>
              Now you have no excuses, it's time to surprise your clients, your
              competitors, and why not, the world. You probably won't have a
              better chance to show off all your potential if it's not by
              designing a website for your own agency or web studio.
            </h5>
            <br />
            <div className="buttons">
              <Button
                className="btn-round"
                color="danger"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
                size="lg"
              >
                Read More
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-twitter" />
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-facebook-square" />
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-get-pocket" />
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    ),
    altText: "",
    caption: "",
  },
  {
    src: "url(" + require("assets/img/sections/section-header-2.jpg") + ")",
    content: (
      <Container>
        <Row>
          <Col className="ml-auto mr-auto text-center" md="8">
            <h1 className="title">Awesome Experiences</h1>
            <h5>
              Now you have no excuses, it's time to surprise your clients, your
              competitors, and why not, the world. You probably won't have a
              better chance to show off all your potential if it's not by
              designing a website for your own agency or web studio.
            </h5>
            <br />
            <h6>Connect with us:</h6>
            <div className="buttons">
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-twitter" />
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-facebook-square" />
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-instagram" />
              </Button>
              <Button
                className="btn-neutral btn-just-icon"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
              >
                <i className="fa fa-google-plus" />
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    ),
    altText: "",
    caption: "",
  },
  {
    src: "url(" + require("assets/img/sections/section-header-3.jpg") + ")",
    content: (
      <Container>
        <Row>
          <Col className="ml-auto text-right" md="7">
            <h2 className="title">Premium Offers for Venice</h2>
            <h5>
              Now you have no excuses, it's time to surprise your clients, your
              competitors, and why not, the world. You probably won't have a
              better chance to show off all your potential if it's not by
              designing a website for your own agency or web studio.
            </h5>
            <br />
            <div className="buttons">
              <Button
                className="btn-neutral"
                color="link"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
                size="lg"
              >
                <i className="fa fa-share-alt" />
                Share Offer
              </Button>
              <Button
                className="btn-round"
                color="success"
                href="#pablo"
                onClick={(e) => e.preventDefault()}
                size="lg"
              >
                <i className="fa fa-shopping-cart" />
                Shop Now
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    ),
    altText: "",
    caption: "",
  },
];

function Header() {
  // carousel - header 3
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const onExiting = () => {
    setAnimating(true);
  };
  const onExited = () => {
    setAnimating(false);
  };
  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };
  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };
  const goToIndex = (newIndex) => {
    if (animating) return;
    setActiveIndex(newIndex);
  };
  // video - header 4
  const [videoPlaying, setVideoPlaying] = React.useState(false);
  const videoRef = React.createRef();
  const videoButtonClick = () => {
    if (videoPlaying) {
      setVideoPlaying(false);
      videoRef.current.pause();
    } else {
      setVideoPlaying(true);
      videoRef.current.play();
    }
  };
  return (
    <>
      <div className="section section-header cd-section" id="headers">        
        <div className="header-2">
          <Navbar className="navbar-transparent navbar-absolute" expand="lg">
            <Container>
              <NavbarBrand className="mb-0" href="www.creative-tim.com">
                Creative Tim
              </NavbarBrand>
              <button
                className="navbar-toggler"
                id="navbarSupportedContent2"
                type="button"
              >
                <span className="navbar-toggler-bar" />
                <span className="navbar-toggler-bar" />
                <span className="navbar-toggler-bar" />
              </button>
              <UncontrolledCollapse navbar toggler="#navbarSupportedContent2">
                <Nav className="ml-auto" navbar>
                  <Button
                    className="btn-neutral"
                    color="link"
                    href="#pablo"
                    onClick={(e) => e.preventDefault()}
                  >
                    Components
                  </Button>
                  <Button
                    className="btn-neutral"
                    color="link"
                    href="#pablo"
                    onClick={(e) => e.preventDefault()}
                  >
                    Tutorial
                  </Button>
                  <Button
                    className="btn-neutral"
                    color="link"
                    href="#pablo"
                    onClick={(e) => e.preventDefault()}
                    target="_blank"
                  >
                    <i className="fa fa-twitter" />
                  </Button>
                  <Button
                    className="btn-neutral"
                    color="link"
                    href="#pablo"
                    onClick={(e) => e.preventDefault()}
                    target="_blank"
                  >
                    <i className="fa fa-facebook" />
                  </Button>
                </Nav>
              </UncontrolledCollapse>
            </Container>
          </Navbar>
          <div
            className="page-header"
            style={{
              backgroundImage:
                "url(" + require("assets/img/sections/header-2.jpg") + ")",
            }}
          >
            <div className="filter" />
            <div className="content-center">
              <Container>
                <Row>
                  <Col className="ml-auto mr-auto text-center" md="8">
                    <h1 className="title">Find your next trip</h1>
                    <h5 className="description">
                      Now you have no excuses, it's time to surprise your
                      clients, your competitors, and why not, the world. You
                      probably won't have a better chance to show off all your
                      potential if it's not by designing a website for your own
                      agency or web studio.
                    </h5>
                    <br />
                  </Col>
                  <Col className="ml-auto mr-auto" md="10">
                    <Card className="card-raised card-form-horizontal no-transition">
                      <CardBody>
                        <Form action="" method="">
                          <Row>
                            <Col md="3">
                              <FormGroup>
                                <Input
                                  defaultValue=""
                                  placeholder="City"
                                  type="text"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Input
                                  defaultValue=""
                                  placeholder="Country"
                                  type="text"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <FormGroup>
                                <Input
                                  defaultValue=""
                                  placeholder="Date"
                                  type="text"
                                />
                              </FormGroup>
                            </Col>
                            <Col md="3">
                              <Button block color="danger" type="button">
                                <i className="nc-icon nc-zoom-split" /> Search
                              </Button>
                            </Col>
                          </Row>
                        </Form>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </div>  
       </div>
    </>
  );
}

export default Header;